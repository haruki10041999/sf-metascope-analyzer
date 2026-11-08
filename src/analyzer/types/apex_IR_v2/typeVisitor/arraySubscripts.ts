import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ArraySubscriptsType = TypeField<'arraySubscripts'> & {
    dimention: number | null;
};

export class ArraySubscriptsTypeClass extends ApexCommonTypeClass<
    'arraySubscripts',
    ArraySubscriptsType
> {
    private constructor(dimention: number | null, sourceSpan: SourceSpan) {
        super('arraySubscripts', { dimention: dimention }, sourceSpan);
    }

    static create(ctx: ArraySubscriptsContext): ArraySubscriptsTypeClass {
        return new ArraySubscriptsTypeClass(
            ctx.LBRACK_list().length > 0 ? ctx.LBRACK_list().length : null,
            getSourceSpan(ctx),
        );
    }
}

export const isArraySubscriptsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArraySubscriptsTypeClass => {
    return isSpicifyApexCommonTypeClass('arraySubscripts', target);
};
