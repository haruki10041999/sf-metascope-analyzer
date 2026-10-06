import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class LocalVariableDeclarationTypeClass extends DeclarationTypeClass<VariableDeclaratorsTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[] = [];

    private constructor(
        value: VariableDeclaratorsTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
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
            isValidClass(
                new VariableVisitor().visit(ctx.variableDeclarators()),
                isVariableDeclaratorsType,
                'variableDeclarators',
            ),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            isValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier_list',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isLocalVariableDeclarationType = (
    target: CommonTypeClass,
): target is LocalVariableDeclarationTypeClass => {
    return target instanceof LocalVariableDeclarationTypeClass;
};
