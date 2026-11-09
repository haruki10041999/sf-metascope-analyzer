import { SetterContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from './block';

import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SetterType = TypeField<'setter'> & {
    /** `set;` (自動プロパティ) は本体を持たない */
    block: BlockTypeClass | null;
};

export class SetterTypeClass extends ApexCommonTypeClass<'setter', SetterType> {
    private constructor(fields: FieldsOf<SetterType>, sourceSpan: SourceSpan) {
        super('setter', fields, sourceSpan);
    }

    static create(ctx: SetterContext): SetterTypeClass {
        return new SetterTypeClass(
            { block: createOptionalNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block') },
            getSourceSpan(ctx),
        );
    }

    getBlock(): SetterType['block'] {
        return this.getFields().block;
    }
}

export const isSetterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SetterTypeClass => {
    return isSpicifyApexCommonTypeClass('setter', target);
};
