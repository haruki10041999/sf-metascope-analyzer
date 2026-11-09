import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { TypeRefTypeClass } from '../typeVisitor';
import { VariableDeclaratorsTypeClass } from '../variableVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FieldDeclarationType = TypeField<'fieldDeclaration'> & {
    valueType: TypeRefTypeClass;
    declarators: VariableDeclaratorsTypeClass;
};

export class FieldDeclarationTypeClass extends ApexCommonTypeClass<
    'fieldDeclaration',
    FieldDeclarationType
> {
    private constructor(fields: FieldsOf<FieldDeclarationType>, sourceSpan: SourceSpan) {
        super('fieldDeclaration', fields, sourceSpan);
    }

    static create(ctx: FieldDeclarationContext): FieldDeclarationTypeClass {
        return new FieldDeclarationTypeClass(
            {
                valueType: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                declarators: createNode(
                    ctx.variableDeclarators(),
                    (c) => VariableDeclaratorsTypeClass.create(c),
                    'variableDeclarators',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValueType(): FieldDeclarationType['valueType'] {
        return this.getFields().valueType;
    }

    getDeclarators(): FieldDeclarationType['declarators'] {
        return this.getFields().declarators;
    }
}

export const isFieldDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FieldDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('fieldDeclaration', target);
};
