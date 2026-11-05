import { GetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitOptionalNode } from '../commonVisitor';

export class GetterTypeClass extends BlockTypeClass<'getter', NormalBlockTypeClass | null> {
    private constructor(value: NormalBlockTypeClass | ApexErrorTypeClass | null) {
        super('getter', value);
    }

    static create(ctx: GetterContext): GetterTypeClass {
        if (!ctx.GET()) {
            throw new Error('値が異常です。GetterContext: ' + ctx.getText());
        }

        return new GetterTypeClass(
            visitOptionalNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
        );
    }
}

export const isGetterType = (target: ApexCommonTypeClass<string>): target is GetterTypeClass => {
    return target instanceof GetterTypeClass;
};
