import { NetworkListContext } from '@apexdevtools/apex-parser';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type NetworkListType = TypeField<'networkList'> & {
    value: string[];
};

export class NetworkListTypeClass extends ApexCommonTypeClass<'networkList', NetworkListType> {
    private constructor(fields: FieldsOf<NetworkListType>, sourceSpan: SourceSpan) {
        super('networkList', fields, sourceSpan);
    }

    static create(ctx: NetworkListContext): NetworkListTypeClass {
        const literal = ctx.StringLiteral() ?? ctx.MultilineStringLiteral();
        if (!literal) {
            throw new Error('値が異常です。NetworkListContext: ' + ctx.getText());
        }

        const value: NetworkListType['value'] = [literal.getText()];

        // 入れ子の networkList は平坦化する
        if (ctx.networkList()) {
            const nested = createNode(
                ctx.networkList(),
                (c) => NetworkListTypeClass.create(c),
                'networkList',
            );
            if (isNetworkListType(nested)) {
                value.push(...nested.getValue());
            } else {
                value.push(nested);
            }
        }

        return new NetworkListTypeClass({ value }, getSourceSpan(ctx));
    }

    getValue(): NetworkListType['value'] {
        return this.getFields().value;
    }
}

export const isNetworkListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is NetworkListTypeClass => isSpicifyApexCommonTypeClass('networkList', target);
