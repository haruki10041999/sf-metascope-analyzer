import { SetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, visitOptionalNode } from '../commonVisitor';

export class SetterTypeClass extends BlockTypeClass<'setter', NormalBlockTypeClass | null> {
    private constructor(value: NormalBlockTypeClass | ApexErrorTypeClass | null) {
        super('setter', value);
    }

    static create(ctx: SetterContext): SetterTypeClass {
        if (!ctx.SET()) {
            throw new Error('値が異常です。SetterContext: ' + ctx.getText());
        }

        return new SetterTypeClass(
            visitOptionalNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
        );
    }
}

export const isSetterType = (target: ApexCommonTypeClass<string>): target is SetterTypeClass => {
    return target instanceof SetterTypeClass;
};
