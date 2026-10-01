import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import { PairTypeClass, ElementValuePairTypeClass, PairVisitor, isElementValuePairType } from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class ElementValuePairsTypeClass extends PairTypeClass<ElementValuePairTypeClass[]> {
    constructor(pairs: ElementValuePairTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('elementValuePairs', pairs, errorClasses);
    }

    static create(ctx: ElementValuePairsContext): ElementValuePairsTypeClass {
        if (!ctx.elementValuePair_list() || ctx.elementValuePair_list().length === 0) {
            throw new Error('値が異常です。ElementValuePairsContext: ' + ctx.getText());
        }

        const pairs: ElementValuePairTypeClass[] = [];
        const errorTypeClasses: Record<string, ErrorTypeClass> = {};

        ctx.elementValuePair_list().forEach((elementValuePairCtx, index) => {
            const pair = new PairVisitor().visit(elementValuePairCtx);
            if (isElementValuePairType(pair)) {
                pairs.push(pair);
            } else if (isErrorType(pair)) {
                errorTypeClasses[`value_${index}`] = pair;
            }
        });

        return new ElementValuePairsTypeClass(pairs, errorTypeClasses);
    }
}

export const isElementValuePairsType = (
    target: CommonTypeClass,
): target is ElementValuePairsTypeClass => {
    return target instanceof ElementValuePairsTypeClass;
};
