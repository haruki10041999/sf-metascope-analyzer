import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { SoqlLiteralTypeClass, LiteralVisitor, isSoqlLiteralType } from '../literalVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class SoqlPrimaryTypeClass extends PrimaryTypeClass<'soqlPrimary', SoqlLiteralTypeClass> {
    private constructor(value: SoqlLiteralTypeClass | ApexErrorTypeClass) {
        super('soqlPrimary', value);
    }

    static create(ctx: SoqlPrimaryContext): SoqlPrimaryTypeClass {
        const primary = new LiteralVisitor().visit(ctx.soqlLiteral());
        return new SoqlPrimaryTypeClass(
            isApexValidClass(primary, isSoqlLiteralType, 'soqlLiteral'),
        );
    }
}

export const isSoqlPrimaryType = (
    target: ApexCommonTypeClass<string>,
): target is SoqlPrimaryTypeClass => {
    return target instanceof SoqlPrimaryTypeClass;
};

