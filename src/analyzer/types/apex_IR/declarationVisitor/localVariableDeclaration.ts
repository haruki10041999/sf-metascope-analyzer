import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { ModifierTypeClass } from '../modifierVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import { VariableDeclaratorsTypeClass } from '../variableVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type LocalVariableDeclarationType = TypeField<'localVariableDeclaration'> & {
    modifiers: ModifierTypeClass[];
    valueType: TypeRefTypeClass;
    declarators: VariableDeclaratorsTypeClass;
};

export class LocalVariableDeclarationTypeClass extends ApexCommonTypeClass<
    'localVariableDeclaration',
    LocalVariableDeclarationType
> {
    private constructor(fields: FieldsOf<LocalVariableDeclarationType>, sourceSpan: SourceSpan) {
        super('localVariableDeclaration', fields, sourceSpan);
    }

    static create(ctx: LocalVariableDeclarationContext): LocalVariableDeclarationTypeClass {
        return new LocalVariableDeclarationTypeClass(
            {
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
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

    getModifiers(): LocalVariableDeclarationType['modifiers'] {
        return this.getFields().modifiers;
    }

    getValueType(): LocalVariableDeclarationType['valueType'] {
        return this.getFields().valueType;
    }

    getDeclarators(): LocalVariableDeclarationType['declarators'] {
        return this.getFields().declarators;
    }
}

export const isLocalVariableDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is LocalVariableDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('localVariableDeclaration', target);
};
