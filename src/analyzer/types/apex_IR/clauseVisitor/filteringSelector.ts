import { FilteringSelectorContext } from '@apexdevtools/apex-parser';

type FilteringSelectorField = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export type FilteringSelectorType = {
    type: 'filteringSelector';
    clause: FilteringSelectorField;
};

export const makeFilteringSelectorType = (ctx: FilteringSelectorContext): FilteringSelectorType => {
    if (ctx.AT()) {
        return {
            type: 'filteringSelector',
            clause: 'AT',
        };
    }

    if (ctx.ABOVE()) {
        return {
            type: 'filteringSelector',
            clause: 'ABOVE',
        };
    }

    if (ctx.BELOW()) {
        return {
            type: 'filteringSelector',
            clause: 'BELOW',
        };
    }

    if (ctx.ABOVE_OR_BELOW()) {
        return {
            type: 'filteringSelector',
            clause: 'ABOVE_OR_BELOW',
        };
    }

    throw new Error(`値が異常です。FilteringSelectorContext:${ctx.getText()}`);
};

