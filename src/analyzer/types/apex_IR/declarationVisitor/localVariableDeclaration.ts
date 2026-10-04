import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class LocalVariableDeclarationTypeClass extends DeclarationTypeClass<VariableDeclaratorsTypeClass> {
    private valueType: TypeRefTypeClass | null = null;
    private modifier: NormalModifierTypeClass[] = [];

    private constructor(
        value: VariableDeclaratorsTypeClass | null,
        valueType: TypeRefTypeClass | null,
        modifier: NormalModifierTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('localVariableDeclaration', value, errorClasses);
        this.valueType = valueType;
        this.modifier = modifier;
    }

    static create(ctx: LocalVariableDeclarationContext): LocalVariableDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.variableDeclarators()) {
            throw new Error('値が異常です。LocalVariableDeclarationContext: ' + ctx.getText());
        }

        let value: VariableDeclaratorsTypeClass | null = null;
        let valueType: TypeRefTypeClass | null = null;
        const modifier: NormalModifierTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const variableTypeClass = new VariableVisitor().visit(ctx.variableDeclarators());
        if (isVariableDeclaratorsType(variableTypeClass)) {
            value = variableTypeClass;
        } else if (isErrorType(variableTypeClass)) {
            errorClasses['value'] = variableTypeClass;
        }

        const typeTypeClass = new VariableVisitor().visit(ctx.variableDeclarators());
        if (isTypeRefType(typeTypeClass)) {
            valueType = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['valueType'] = typeTypeClass;
        }

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            ctx.modifier_list().forEach((modifierCtx, index) => {
                const modifierTypeClass = new ModifierVisitor().visit(modifierCtx);
                if (isNormalModifierType(modifierTypeClass)) {
                    modifier.push(modifierTypeClass);
                } else if (isErrorType(modifierTypeClass)) {
                    errorClasses[`modifier_${index}`] = modifierTypeClass;
                }
            });
        }

        return new LocalVariableDeclarationTypeClass(value, valueType, modifier, errorClasses);
    }

    getValueType(): TypeRefTypeClass | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }

    getModifier(): NormalModifierTypeClass[] {
        return this.modifier;
    }
}

export const isLocalVariableDeclarationType = (
    target: CommonTypeClass,
): target is LocalVariableDeclarationTypeClass => {
    return target instanceof LocalVariableDeclarationTypeClass;
};
