import { FinallyBlockContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from './block';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FinallyBlockType = TypeField<'finallyBlock'> & {
    block: BlockTypeClass;
};

export class FinallyBlockTypeClass extends ApexCommonTypeClass<'finallyBlock', FinallyBlockType> {
    private constructor(fields: FieldsOf<FinallyBlockType>, sourceSpan: SourceSpan) {
        super('finallyBlock', fields, sourceSpan);
    }

    static create(ctx: FinallyBlockContext): FinallyBlockTypeClass {
        return new FinallyBlockTypeClass(
            { block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block') },
            getSourceSpan(ctx),
        );
    }

    getBlock(): FinallyBlockType['block'] {
        return this.getFields().block;
    }
}

export const isFinallyBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FinallyBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('finallyBlock', target);
};
