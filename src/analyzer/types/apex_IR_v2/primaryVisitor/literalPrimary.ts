import { LiteralPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import { ApexCommonTypeClass, ApexErrorTypeClass, visitNode } from '../commonVisitor';

export class LiteralPrimaryTypeClass extends PrimaryTypeClass<
    'literalPrimary',
    NormalLiteralTypeClass
> {
    private constructor(value: NormalLiteralTypeClass | ApexErrorTypeClass) {
        super('literalPrimary', value);
    }

    static create(ctx: LiteralPrimaryContext): LiteralPrimaryTypeClass {
        if (!ctx.literal()) {
            throw new Error('値が異常です。LiteralPrimaryContext: ' + ctx.getText());
        }

        return new LiteralPrimaryTypeClass(
            visitNode(new LiteralVisitor(), ctx.literal(), isNormalLiteralType, 'literal'),
        );
    }
}

export const isLiteralPrimaryType = (
    target: ApexCommonTypeClass<string>,
): target is LiteralPrimaryTypeClass => {
    return target instanceof LiteralPrimaryTypeClass;
};
