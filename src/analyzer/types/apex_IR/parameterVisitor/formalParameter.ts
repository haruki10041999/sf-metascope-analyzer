import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '../parameterVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FormalParameterTypeClass extends ParameterTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | null = null;
    private modifier: NormalModifierTypeClass[] = [];

    private constructor(
        value: NormalIdTypeClass | null,
        valueType: TypeRefTypeClass | null,
        modifier: NormalModifierTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('formalParameter', value, errorClasses);
        this.valueType = valueType;
        this.modifier = modifier;
    }

    static create(ctx: FormalParameterContext): FormalParameterTypeClass {
        if (!ctx.id() || !ctx.typeRef()) {
            throw new Error('値が異常です。FormalParameterContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let valueType: TypeRefTypeClass | null = null;
        let modifier: NormalModifierTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClasss = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClasss)) {
            value = idTypeClasss;
        } else if (isErrorType(idTypeClasss)) {
            errorClasses['value'] = idTypeClasss;
        }

        const typeTypeClass = new TypeVisitor().visit(ctx.typeRef());
        if (isTypeRefType(typeTypeClass)) {
            valueType = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['valueType'] = typeTypeClass;
        }

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            ctx.modifier_list().forEach((modifierCtx) => {
                const modifierTypeClass = new ModifierVisitor().visit(modifierCtx);
                if (isNormalModifierType(modifierTypeClass)) {
                    modifier.push(modifierTypeClass);
                } else if (isErrorType(modifierTypeClass)) {
                    errorClasses['modifier'] = modifierTypeClass;
                }
            });
        }

        return new FormalParameterTypeClass(value, valueType, modifier, errorClasses);
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

export const isFormalParameterType = (
    target: CommonTypeClass,
): target is FormalParameterTypeClass => {
    return target instanceof FormalParameterTypeClass;
};
