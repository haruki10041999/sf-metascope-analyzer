import { FilteringSelectorContext } from '@apexdevtools/apex-parser';

type FilteringSelectorField = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export type FilteringSelectorType = {
    type: 'filteringSelector';
    selector: FilteringSelectorField;
};

export const makeFilteringSelectorType = (ctx: FilteringSelectorContext): FilteringSelectorType => {
    if (ctx.AT()) {
        return {
            type: 'filteringSelector',
            selector: 'AT',
        };
    }

    if (ctx.ABOVE()) {
        return {
            type: 'filteringSelector',
            selector: 'ABOVE',
        };
    }

    if (ctx.BELOW()) {
        return {
            type: 'filteringSelector',
            selector: 'BELOW',
        };
    }

    if (ctx.ABOVE_OR_BELOW()) {
        return {
            type: 'filteringSelector',
            selector: 'ABOVE_OR_BELOW',
        };
    }

    throw new Error(`値が異常です。FilteringSelectorContext:${ctx.getText()}`);
};
