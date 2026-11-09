import { InterfaceMethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ModifierTypeClass } from '../modifierVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import { FormalParametersTypeClass } from '../parameterVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type InterfaceMethodDeclarationType = TypeField<'interfaceMethodDeclaration'> & {
    modifiers: ModifierTypeClass[];
    returnType: TypeRefTypeClass | 'void';
    name: IdTypeClass;
    parameters: FormalParametersTypeClass;
};

export class InterfaceMethodDeclarationTypeClass extends ApexCommonTypeClass<
    'interfaceMethodDeclaration',
    InterfaceMethodDeclarationType
> {
    private constructor(fields: FieldsOf<InterfaceMethodDeclarationType>, sourceSpan: SourceSpan) {
        super('interfaceMethodDeclaration', fields, sourceSpan);
    }

    static create(ctx: InterfaceMethodDeclarationContext): InterfaceMethodDeclarationTypeClass {
        return new InterfaceMethodDeclarationTypeClass(
            {
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
                returnType: ctx.VOID()
                    ? 'void'
                    : createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                parameters: createNode(
                    ctx.formalParameters(),
                    (c) => FormalParametersTypeClass.create(c),
                    'formalParameters',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getModifiers(): InterfaceMethodDeclarationType['modifiers'] {
        return this.getFields().modifiers;
    }

    getReturnType(): InterfaceMethodDeclarationType['returnType'] {
        return this.getFields().returnType;
    }

    getName(): InterfaceMethodDeclarationType['name'] {
        return this.getFields().name;
    }

    getParameters(): InterfaceMethodDeclarationType['parameters'] {
        return this.getFields().parameters;
    }
}

export const isInterfaceMethodDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InterfaceMethodDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('interfaceMethodDeclaration', target);
};
