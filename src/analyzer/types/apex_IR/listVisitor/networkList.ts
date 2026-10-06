import { NetworkListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass, ListVisitor } from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class NetworkListTypeClass extends ListTypeClass<string> {
    private constructor(value: (string | ErrorTypeClass)[]) {
        super('networkList', value);
    }

    static create(ctx: NetworkListContext): NetworkListTypeClass {
        if (!ctx.StringLiteral() && !ctx.MultilineStringLiteral()) {
            throw new Error('値が異常です。NetworkListContext: ' + ctx.getText());
        }

        const value: (string | ErrorTypeClass)[] = [];

        if (ctx.StringLiteral()) {
            value.push(ctx.StringLiteral().getText());
        } else {
            value.push(ctx.MultilineStringLiteral().getText());
        }

        if (ctx.networkList()) {
            const nested = isValidClass(
                new ListVisitor().visit(ctx.networkList()),
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

export const isNetworkListType = (target: CommonTypeClass): target is NetworkListTypeClass => {
    return target instanceof NetworkListTypeClass;
};
