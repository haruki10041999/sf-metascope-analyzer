import { ElementValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class ElementValueTypeClass extends ValueTypeClass<'elementValue', NormalLiteralTypeClass> {
    private constructor(value: NormalLiteralTypeClass | ApexErrorTypeClass) {
        super('elementValue', value);
    }

    static create(ctx: ElementValueContext) {
        if (!ctx.literal()) {
            throw new Error('値が異常です。ElementValueContext: ' + ctx.getText());
        }

        return new ElementValueTypeClass(
            visitNode(new LiteralVisitor(), ctx.literal(), isNormalLiteralType, 'literal'),
        );
    }
}

export const isElementValueType = (
    target: ApexCommonTypeClass<string>,
): target is ElementValueTypeClass => {
    return target instanceof ElementValueTypeClass;
};
