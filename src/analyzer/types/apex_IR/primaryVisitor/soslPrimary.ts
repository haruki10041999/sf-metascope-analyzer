import { SoslPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { SoslLiteralTypeClass, LiteralVisitor, isSoslLiteralType } from '../literalVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class SoslPrimaryTypeClass extends PrimaryTypeClass<'soslPrimary', SoslLiteralTypeClass> {
    private constructor(value: SoslLiteralTypeClass | ApexErrorTypeClass) {
        super('soslPrimary', value);
    }

    static create(ctx: SoslPrimaryContext): SoslPrimaryTypeClass {
        if (!ctx.soslLiteral()) {
            throw new Error('値が異常です。SoslPrimaryContext: ' + ctx.getText());
        }

        return new SoslPrimaryTypeClass(
            isApexValidClass(
                new LiteralVisitor().visit(ctx.soslLiteral()),
                isSoslLiteralType,
                'soslLiteral',
            ),
        );
    }
}

export const isSoslPrimaryType = (
    target: ApexCommonTypeClass<string>,
): target is SoslPrimaryTypeClass => {
    return target instanceof SoslPrimaryTypeClass;
};

