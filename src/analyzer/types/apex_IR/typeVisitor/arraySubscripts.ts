import { ArraySubscriptsContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ArraySubscriptsType = TypeField<'arraySubscripts'> & {
    /** `[]` の数。配列でなければ null */
    dimention: number | null;
};

export class ArraySubscriptsTypeClass extends ApexCommonTypeClass<
    'arraySubscripts',
    ArraySubscriptsType
> {
    private constructor(fields: FieldsOf<ArraySubscriptsType>, sourceSpan: SourceSpan) {
        super('arraySubscripts', fields, sourceSpan);
    }

    static create(ctx: ArraySubscriptsContext): ArraySubscriptsTypeClass {
        const dimention = ctx.LBRACK_list().length;
        return new ArraySubscriptsTypeClass(
            { dimention: dimention > 0 ? dimention : null },
            getSourceSpan(ctx),
        );
    }

    getDimention(): ArraySubscriptsType['dimention'] {
        return this.getFields().dimention;
    }
}

export const isArraySubscriptsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ArraySubscriptsTypeClass => isSpicifyApexCommonTypeClass('arraySubscripts', target);
