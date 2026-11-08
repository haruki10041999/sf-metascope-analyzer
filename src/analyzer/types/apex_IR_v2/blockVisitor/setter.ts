import { SetterContext } from '@apexdevtools/apex-parser';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { BlockTypeClass } from './block';
import { SourceSpan } from '../../commons';

export type SetterType = TypeField<'setter'> & {
    block: BlockTypeClass | null;
};

export class SetterTypeClass extends ApexCommonTypeClass<'setter', SetterType> {
    private constructor(block: BlockTypeClass | null, sourceSpan: SourceSpan) {
        super('setter', { block: block }, sourceSpan);
    }

    static create(ctx: SetterContext): SetterTypeClass {
        if (ctx.block) {
            return new SetterTypeClass(BlockTypeClass.create(ctx.block()), getSourceSpan(ctx));
        } else {
            return new SetterTypeClass(null, getSourceSpan(ctx));
        }
    }
}

export const isSetterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SetterTypeClass => {
    return isSpicifyApexCommonTypeClass('setter', target);
};
