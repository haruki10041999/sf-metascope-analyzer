import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class FinallyBlockTypeClass extends BlockTypeClass<'finallyBlock', NormalBlockTypeClass> {
    private constructor(value: NormalBlockTypeClass | ApexErrorTypeClass) {
        super('finallyBlock', value);
    }

    static create(ctx: FinallyBlockContext): FinallyBlockTypeClass {
        if (!ctx.block()) {
            throw new Error('値が異常です。FinallyBlockContext: ' + ctx.getText());
        }

        return new FinallyBlockTypeClass(
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }
}

export const isFinallyBlockType = (
    target: ApexCommonTypeClass<string>,
): target is FinallyBlockTypeClass => {
    return target instanceof FinallyBlockTypeClass;
};
