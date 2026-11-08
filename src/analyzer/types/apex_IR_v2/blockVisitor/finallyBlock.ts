import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from '.';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FinallyBlockType = TypeField<'finallyBlock'> & {
    block: BlockTypeClass;
};

export class FinallyBlockTypeClass extends ApexCommonTypeClass<'finallyBlock', FinallyBlockType> {
    private constructor(block: BlockTypeClass, sourceSpan: SourceSpan) {
        super('finallyBlock', { block: block }, sourceSpan);
    }

    static create(ctx: FinallyBlockContext): FinallyBlockTypeClass {
        return new FinallyBlockTypeClass(BlockTypeClass.create(ctx.block()), getSourceSpan(ctx));
    }
}

export const isFinallyBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FinallyBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('finallyBlock', target);
};
