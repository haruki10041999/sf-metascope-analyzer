import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import {
    PairListTypeClass,
    ElementValuePairTypeClass,
    PairVisitor,
    isElementValuePairType,
} from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class ElementValuePairsTypeClass extends PairListTypeClass<
    'elementValuePairs',
    ElementValuePairTypeClass
> {
    private constructor(value: (ElementValuePairTypeClass | ApexErrorTypeClass)[]) {
        super('elementValuePairs', value);
    }

    static create(ctx: ElementValuePairsContext): ElementValuePairsTypeClass {
        if (!ctx.elementValuePair_list() || ctx.elementValuePair_list().length === 0) {
            throw new Error('値が異常です。ElementValuePairsContext: ' + ctx.getText());
        }

        return new ElementValuePairsTypeClass(
            isApexValidClassList(
                ctx.elementValuePair_list(),
                (ctx) => new PairVisitor().visit(ctx),
                isElementValuePairType,
                'elementValuePair',
            ),
        );
    }
}

export const isElementValuePairsType = (
    target: ApexCommonTypeClass<string>,
): target is ElementValuePairsTypeClass => {
    return target instanceof ElementValuePairsTypeClass;
};
