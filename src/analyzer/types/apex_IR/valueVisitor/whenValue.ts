import { WhenValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { WhenLiteralTypeClass, LiteralVisitor, isWhenLiteralType } from '../literalVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

type WhenValueValueType = WhenLiteralTypeClass[] | NormalIdTypeClass | 'else';

export class WhenValueTypeClass extends ValueTypeClass<WhenValueValueType> {
    private valueType: TypeRefTypeClass | null = null;

    private constructor(
        value: WhenValueValueType | null,
        valueType: TypeRefTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('whenValue', value, errorClasses);
        this.valueType = valueType;
    }

    static create(ctx: WhenValueContext): WhenValueTypeClass {
        if (
            !ctx.ELSE() &&
            (!ctx.whenLiteral_list() || ctx.whenLiteral_list().length === 0) &&
            !ctx.typeRef() &&
            !ctx.id()
        ) {
            throw new Error('値が異常です。WhenValueContext: ' + ctx.getText());
        }

        let value: WhenValueValueType | null = null;
        let valueType: TypeRefTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.ELSE()) {
            value = 'else';
        }

        if (ctx.whenLiteral_list() && ctx.whenLiteral_list().length > 0) {
            const literalTypeClasses: WhenLiteralTypeClass[] = [];
            ctx.whenLiteral_list().forEach((whenLiteralCtx, index) => {
                const literalTypeClass = new LiteralVisitor().visit(whenLiteralCtx);
                if (isWhenLiteralType(literalTypeClass)) {
                    literalTypeClasses.push(literalTypeClass);
                } else if (isErrorType(literalTypeClass)) {
                    errorClasses[`value_${index}`] = literalTypeClass;
                }
            });
            value = literalTypeClasses;
        }

        if (ctx.id() && ctx.typeRef()) {
            const idTypeClass = new IdVisitor().visit(ctx.id());
            if (isNormalIdType(idTypeClass)) {
                value = idTypeClass;
            } else if (isErrorType(idTypeClass)) {
                errorClasses['value'] = idTypeClass;
            }

            const typeTypeClass = new TypeVisitor().visit(ctx.typeRef());
            if (isTypeRefType(typeTypeClass)) {
                valueType = typeTypeClass;
            } else if (isErrorType(typeTypeClass)) {
                errorClasses['valueType'] = typeTypeClass;
            }
        }

        return new WhenValueTypeClass(value, valueType, errorClasses);
    }

    getValueType(): TypeRefTypeClass | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }
}

export const isWhenValueType = (target: any): target is WhenValueTypeClass => {
    return target instanceof WhenValueTypeClass;
};
