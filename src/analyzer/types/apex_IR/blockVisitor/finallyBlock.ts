import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FinallyBlockTypeClass extends BlockTypeClass<NormalBlockTypeClass> {
    private constructor(value: NormalBlockTypeClass | ErrorTypeClass) {
        super('finallyBlock', value);
    }

    static create(ctx: FinallyBlockContext): FinallyBlockTypeClass {
        if (!ctx.block()) {
            throw new Error('値が異常です。FinallyBlockContext: ' + ctx.getText());
        }

        return new FinallyBlockTypeClass(
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }
}

export const isFinallyBlockType = (target: CommonTypeClass): target is FinallyBlockTypeClass => {
    return target instanceof FinallyBlockTypeClass;
};
