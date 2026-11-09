import { GetterContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from './block';

import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type GetterType = TypeField<'getter'> & {
    /** `get;` (自動プロパティ) は本体を持たない */
    block: BlockTypeClass | null;
};

export class GetterTypeClass extends ApexCommonTypeClass<'getter', GetterType> {
    private constructor(fields: FieldsOf<GetterType>, sourceSpan: SourceSpan) {
        super('getter', fields, sourceSpan);
    }

    static create(ctx: GetterContext): GetterTypeClass {
        return new GetterTypeClass(
            { block: createOptionalNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block') },
            getSourceSpan(ctx),
        );
    }

    getBlock(): GetterType['block'] {
        return this.getFields().block;
    }
}

export const isGetterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is GetterTypeClass => {
    return isSpicifyApexCommonTypeClass('getter', target);
};
