import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import { NormalQueryTypeClass, QueryVisitor, isNormalQueryType } from '../queryVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class SoqlLiteralTypeClass extends LiteralTypeClass<'soqlLiteral', NormalQueryTypeClass> {
    private constructor(value: NormalQueryTypeClass | ApexErrorTypeClass) {
        super('soqlLiteral', value);
    }

    static create(ctx: SoqlLiteralContext): SoqlLiteralTypeClass {
        return new SoqlLiteralTypeClass(
            visitNode(new QueryVisitor(), ctx.query(), isNormalQueryType, 'query'),
        );
    }
}

export const isSoqlLiteralType = (
    target: ApexCommonTypeClass<string>,
): target is SoqlLiteralTypeClass => {
    return target instanceof SoqlLiteralTypeClass;
};
