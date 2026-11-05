import { NetworkListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class NetworkListTypeClass extends ListTypeClass<'networkList', string> {
    private constructor(value: (string | ApexErrorTypeClass)[]) {
        super('networkList', value);
    }

    static create(ctx: NetworkListContext): NetworkListTypeClass {
        if (!ctx.StringLiteral() && !ctx.MultilineStringLiteral()) {
            throw new Error('値が異常です。NetworkListContext: ' + ctx.getText());
        }

        const value: (string | ApexErrorTypeClass)[] = [];

        if (ctx.StringLiteral()) {
            value.push(ctx.StringLiteral().getText());
        } else {
            value.push(ctx.MultilineStringLiteral().getText());
        }

        if (ctx.networkList()) {
            const nested = visitNode(
                new ListVisitor(),
                ctx.networkList(),
                isNetworkListType,
                'networkList',
            );

            if (isNetworkListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        }

        return new NetworkListTypeClass(value);
    }
}

export const isNetworkListType = (
    target: ApexCommonTypeClass<string>,
): target is NetworkListTypeClass => {
    return target instanceof NetworkListTypeClass;
};
