import { ElementValuePairContext } from '@apexdevtools/apex-parser';

import { DoublePairTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ElementValueTypeClass, ValueVisitor, isElementValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ElementValuePairTypeClass extends DoublePairTypeClass<
    NormalIdTypeClass,
    ElementValueTypeClass
> {
    private constructor(
        left: NormalIdTypeClass | null,
        right: ElementValueTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('elementValuePair', left, right, errorClasses);
    }

    static create(ctx: ElementValuePairContext): ElementValuePairTypeClass {
        if (!ctx.id() && !ctx.elementValue()) {
            throw new Error('値が異常です。ElementValuePairContext: ' + ctx.getText());
        }

        let left: NormalIdTypeClass | null = null;
        let right: ElementValueTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.id()) {
            const idTypeClass = new IdVisitor().visit(ctx.id());
            if (isNormalIdType(idTypeClass)) {
                left = idTypeClass;
            } else if (isErrorType(idTypeClass)) {
                errorClasses['left'] = idTypeClass;
            }
        }

        if (ctx.elementValue()) {
            const valueTypeClass = new ValueVisitor().visit(ctx.elementValue());
            if (isElementValueType(valueTypeClass)) {
                right = valueTypeClass;
            } else if (isErrorType(valueTypeClass)) {
                errorClasses['right'] = valueTypeClass;
            }
        }

        return new ElementValuePairTypeClass(left, right, errorClasses);
    }
}

export const isElementValuePairType = (
    target: CommonTypeClass,
): target is ElementValuePairTypeClass => {
    return target instanceof ElementValuePairTypeClass;
};
