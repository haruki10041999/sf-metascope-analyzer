import { GetterContext } from '@apexdevtools/apex-parser';

import { NormalBlockTypeClass } from '.';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type GetterType = TypeField<'getter'> & {
    block: NormalBlockTypeClass | null;
};

export class GetterTypeClass extends ApexCommonTypeClass<'getter', GetterType> {
    private constructor(block: NormalBlockTypeClass | null, sourceSpan: SourceSpan) {
        super('getter', { block: block }, sourceSpan);
    }

    static create(ctx: GetterContext): GetterTypeClass {
        if (ctx.block) {
            return new GetterTypeClass(
                NormalBlockTypeClass.create(ctx.block()),
                getSourceSpan(ctx),
            );
        } else {
            return new GetterTypeClass(null, getSourceSpan(ctx));
        }
    }
}

export const isGetterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is GetterTypeClass => {
    return isSpicifyApexCommonTypeClass('getter', target);
};
