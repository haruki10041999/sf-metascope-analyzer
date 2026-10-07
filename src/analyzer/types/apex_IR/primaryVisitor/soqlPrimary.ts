import { SoqlPrimaryContext } from '@apexdevtools/apex-parser';

import { PrimaryTypeClass } from '.';

import { SoqlLiteralTypeClass, LiteralVisitor, isSoqlLiteralType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SoqlPrimaryTypeClass extends PrimaryTypeClass<SoqlLiteralTypeClass> {
    private constructor(value: SoqlLiteralTypeClass | ErrorTypeClass) {
        super('soqlPrimary', value);
    }

    static create(ctx: SoqlPrimaryContext): SoqlPrimaryTypeClass {
        const primary = new LiteralVisitor().visit(ctx.soqlLiteral());
        return new SoqlPrimaryTypeClass(isValidClass(primary, isSoqlLiteralType, 'soqlLiteral'));
    }
}

export const isSoqlPrimaryType = (target: CommonTypeClass): target is SoqlPrimaryTypeClass => {
    return target instanceof SoqlPrimaryTypeClass;
};

