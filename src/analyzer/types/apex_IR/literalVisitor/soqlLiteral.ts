import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import { NormalQueryTypeClass, QueryVisitor, isNormalQueryType } from '../queryVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class SoqlLiteralTypeClass extends LiteralTypeClass<'soqlLiteral', NormalQueryTypeClass> {
    private constructor(value: NormalQueryTypeClass | ApexErrorTypeClass) {
        super('soqlLiteral', value);
    }

    static create(ctx: SoqlLiteralContext): SoqlLiteralTypeClass {
        return new SoqlLiteralTypeClass(
            isApexValidClass(new QueryVisitor().visit(ctx.query()), isNormalQueryType, 'query'),
        );
    }
}

export const isSoqlLiteralType = (
    target: ApexCommonTypeClass<string>,
): target is SoqlLiteralTypeClass => {
    return target instanceof SoqlLiteralTypeClass;
};

