import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass, BlockTypeClass, BlockVisitor, isNormalBlockType } from '.';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FinallyBlockTypeClass extends BlockTypeClass<NormalBlockTypeClass> {
    private constructor(
        value: NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('finallyBlock', value, errorClasses);
    }

    static create(ctx: FinallyBlockContext): FinallyBlockTypeClass {
        if (!ctx.block()) {
            throw new Error('値が異常です。FinallyBlockContext: ' + ctx.getText());
        }

        let value: NormalBlockTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const blockTypeClass = new BlockVisitor().visit(ctx.block());
        if (isNormalBlockType(blockTypeClass)) {
            value = blockTypeClass;
        } else if (isErrorType(blockTypeClass)) {
            errorClasses['value'] = blockTypeClass;
        }

        return new FinallyBlockTypeClass(value, errorClasses);
    }
}

export const isFinallyBlockType = (target: CommonTypeClass): target is FinallyBlockTypeClass => {
    return target instanceof FinallyBlockTypeClass;
};
