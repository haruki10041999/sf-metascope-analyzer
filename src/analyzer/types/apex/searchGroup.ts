import { SearchGroupContext } from '@apexdevtools/apex-parser';

type SearchGroupValue = 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';

export type SearchGroupType = {
    type: 'searchGroup';
    value: SearchGroupValue;
};

export const makeSearchGroupType = (ctx: SearchGroupContext): SearchGroupType => {
    if (ctx.ALL()) {
        return {
            type: 'searchGroup',
            value: 'ALL',
        };
    }

    if (ctx.EMAIL()) {
        return {
            type: 'searchGroup',
            value: 'EMAIL',
        };
    }

    if (ctx.NAME()) {
        return {
            type: 'searchGroup',
            value: 'NAME',
        };
    }

    if (ctx.PHONE()) {
        return {
            type: 'searchGroup',
            value: 'PHONE',
        };
    }

    if (ctx.SIDEBAR()) {
        return {
            type: 'searchGroup',
            value: 'SIDEBAR',
        };
    }

    throw new Error('値が異常です。SearchGroupContext: ' + ctx.getText());
};
