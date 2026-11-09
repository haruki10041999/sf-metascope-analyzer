import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AllRowsClauseType = TypeField<'allRowsClause'> & {
    /** 常に ALL ROWS (ソースの大文字・小文字にかかわらずそろえる) */
    value: 'ALL ROWS';
};

export class AllRowsClauseTypeClass extends ApexCommonTypeClass<
    'allRowsClause',
    AllRowsClauseType
> {
    private constructor(fields: FieldsOf<AllRowsClauseType>, sourceSpan: SourceSpan) {
        super('allRowsClause', fields, sourceSpan);
    }

    static create(ctx: AllRowsClauseContext): AllRowsClauseTypeClass {
        if (!ctx.ALL() || !ctx.ROWS()) {
            throw new Error('値が異常です。AllRowsClauseContext: ' + ctx.getText());
        }

        return new AllRowsClauseTypeClass({ value: 'ALL ROWS' }, getSourceSpan(ctx));
    }

    getValue(): AllRowsClauseType['value'] {
        return this.getFields().value;
    }
}

export const isAllRowsClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AllRowsClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('allRowsClause', target);
};
