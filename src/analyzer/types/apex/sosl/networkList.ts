import { NetworkListContext } from '@apexdevtools/apex-parser';

export type NetworkListType = {
    type: 'networkList';
    values: string[];
};

export const makeNetworkListType = (ctx: NetworkListContext): NetworkListType => {
    return {
        type: 'networkList',
        values: _makeNetworkListValue(ctx),
    };
};

const _makeNetworkListValue = (ctx: NetworkListContext): string[] => {
    let value = '';
    if (ctx.StringLiteral()) {
        value = ctx.StringLiteral().getText();
    } else if (ctx.MultilineStringLiteral()) {
        value = ctx.MultilineStringLiteral().getText();
    }

    const values = [value];

    if (ctx.networkList()) {
        values.push(..._makeNetworkListValue(ctx.networkList()));
    }

    return values;
};
