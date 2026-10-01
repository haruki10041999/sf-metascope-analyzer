import { ElementValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ElementValueTypeClass extends ValueTypeClass<NormalLiteralTypeClass> {
    private constructor(
        value: NormalLiteralTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('elementValue', value, errorClasses);
    }

    static create(ctx: ElementValueContext) {
        if (!ctx.literal()) {
            throw new Error('値が異常です。ElementValueContext: ' + ctx.getText());
        }

        let value: NormalLiteralTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const literalTypeClass = new LiteralVisitor().visit(ctx.literal());
        if (isNormalLiteralType(literalTypeClass)) {
            value = literalTypeClass;
        } else if (isErrorType(literalTypeClass)) {
            errorClasses['value'] = literalTypeClass;
        }

        return new ElementValueTypeClass(value, errorClasses);
    }
}

export const isElementValueType = (target: CommonTypeClass): target is ElementValueTypeClass => {
    return target instanceof ElementValueTypeClass;
};
