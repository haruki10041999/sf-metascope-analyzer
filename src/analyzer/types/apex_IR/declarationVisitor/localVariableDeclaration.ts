import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class LocalVariableDeclarationTypeClass extends DeclarationTypeClass<
    'localVariableDeclaration',
    VariableDeclaratorsTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[] = [];

    private constructor(
        value: VariableDeclaratorsTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('localVariableDeclaration', value);
        this.valueType = valueType;
        this.modifier = modifier;
    }

    static create(ctx: LocalVariableDeclarationContext): LocalVariableDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.variableDeclarators()) {
            throw new Error('値が異常です。LocalVariableDeclarationContext: ' + ctx.getText());
        }

        return new LocalVariableDeclarationTypeClass(
            visitNode(
                new VariableVisitor(),
                ctx.variableDeclarators(),
                isVariableDeclaratorsType,
                'variableDeclarators',
            ),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list(),
                isNormalModifierType,
                'modifier_list',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isLocalVariableDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is LocalVariableDeclarationTypeClass => {
    return target instanceof LocalVariableDeclarationTypeClass;
};
