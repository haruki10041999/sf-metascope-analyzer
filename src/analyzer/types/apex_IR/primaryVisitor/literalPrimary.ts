import { LiteralPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { NormalLiteralTypeClass, LiteralVisitor, isNormalLiteralType } from '../literalVisitor';
import { CommonTypeClass, ErrorTypeClass, isValidClass } from '../commonVisitor';

export class LiteralPrimaryTypeClass extends PrimaryTypeClass<NormalLiteralTypeClass> {
    private constructor(value: NormalLiteralTypeClass | ErrorTypeClass) {
        super('literalPrimary', value);
    }

    static create(ctx: LiteralPrimaryContext): LiteralPrimaryTypeClass {
        if (!ctx.literal()) {
            throw new Error('値が異常です。LiteralPrimaryContext: ' + ctx.getText());
        }

        return new LiteralPrimaryTypeClass(
            isValidClass(new LiteralVisitor().visit(ctx.literal()), isNormalLiteralType, 'literal'),
        );
    }
}

export const isLiteralPrimaryType = (
    target: CommonTypeClass,
): target is LiteralPrimaryTypeClass => {
    return target instanceof LiteralPrimaryTypeClass;
};

