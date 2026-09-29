import { NetworkListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';

export type NetworkListType = {
    type: 'networkList';
    list: string[];
};

export const makeNetworkListType = (ctx: NetworkListContext): NetworkListType => {
    if (!ctx.StringLiteral() && !ctx.MultilineStringLiteral()) {
        throw new Error('値が異常です。NetworkListContext: ' + ctx.getText());
    }

    let value = '';
    if (ctx.StringLiteral()) {
        value = ctx.StringLiteral().getText();
    } else if (ctx.MultilineStringLiteral()) {
        value = ctx.MultilineStringLiteral().getText();
    }

    const list = [];
    if (value !== '') {
        list.push(value);
    }

    if (ctx.networkList()) {
        const nested = new ListVisitor().visit(ctx.networkList());
        if (nested.type === 'networkList') {
            list.push(...nested.list);
        }
    }

    return {
        type: 'networkList',
        list: list,
    };
};

