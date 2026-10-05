import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import {
    PairListTypeClass,
    ElementValuePairTypeClass,
    PairVisitor,
    isElementValuePairType,
} from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class ElementValuePairsTypeClass extends PairListTypeClass<ElementValuePairTypeClass> {
    constructor(value: (ElementValuePairTypeClass | ErrorTypeClass)[]) {
        super('elementValuePairs', value);
    }

    static create(ctx: ElementValuePairsContext): ElementValuePairsTypeClass {
        if (!ctx.elementValuePair_list() || ctx.elementValuePair_list().length === 0) {
            throw new Error('値が異常です。ElementValuePairsContext: ' + ctx.getText());
        }

        return new ElementValuePairsTypeClass(
            isValidClassList(
                ctx.elementValuePair_list(),
                (ctx) => new PairVisitor().visit(ctx),
                isElementValuePairType,
                'elementValuePair',
            ),
        );
    }
}

export const isElementValuePairsType = (
    target: CommonTypeClass,
): target is ElementValuePairsTypeClass => {
    return target instanceof ElementValuePairsTypeClass;
};
