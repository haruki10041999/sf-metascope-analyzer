import { SoqlLiteralContext } from '@apexdevtools/apex-parser';

import { LiteralTypeClass } from '.';

import { NormalQueryTypeClass, QueryVisitor, isNormalQueryType } from '../queryVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class SoqlLiteralTypeClass extends LiteralTypeClass<NormalQueryTypeClass> {
    private constructor(value: NormalQueryTypeClass | ErrorTypeClass) {
        super('soqlLiteral', value);
    }

    static create(ctx: SoqlLiteralContext): SoqlLiteralTypeClass {
        return new SoqlLiteralTypeClass(
            isValidClass(new QueryVisitor().visit(ctx.query()), isNormalQueryType, 'query'),
        );
    }
}

export const isSoqlLiteralType = (target: CommonTypeClass): target is SoqlLiteralTypeClass => {
    return target instanceof SoqlLiteralTypeClass;
};

