import { SearchGroupContext } from '@apexdevtools/apex-parser';

type SearchGroupValue = 'ALL' | 'EMAIL' | 'NAME' | 'PHONE' | 'SIDEBAR';

export type SearchGroupType = {
    type: 'searchGroup';
    query: SearchGroupValue;
};

export const makeSearchGroupType = (ctx: SearchGroupContext): SearchGroupType => {
    if (ctx.ALL()) {
        return {
            type: 'searchGroup',
            query: 'ALL',
        };
    }

    if (ctx.EMAIL()) {
        return {
            type: 'searchGroup',
            query: 'EMAIL',
        };
    }

    if (ctx.NAME()) {
        return {
            type: 'searchGroup',
            query: 'NAME',
        };
    }

    if (ctx.PHONE()) {
        return {
            type: 'searchGroup',
            query: 'PHONE',
        };
    }

    if (ctx.SIDEBAR()) {
        return {
            type: 'searchGroup',
            query: 'SIDEBAR',
        };
    }

    throw new Error('値が異常です。SearchGroupContext: ' + ctx.getText());
};

