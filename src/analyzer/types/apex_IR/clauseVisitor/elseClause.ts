import { ElseClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldNameListTypeClass, ListVisitor, isFieldNameListType } from '../listVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ElseClauseTypeClass extends ClauseTypeClass<'elseClause', FieldNameListTypeClass> {
    private constructor(value: FieldNameListTypeClass | ApexErrorTypeClass) {
        super('elseClause', value);
    }

    static create(ctx: ElseClauseContext): ElseClauseTypeClass {
        if (!ctx.fieldNameList()) {
            throw new Error('値が異常です。ElseClauseContext: ' + ctx.getText());
        }

        return new ElseClauseTypeClass(
            isApexValidClass(
                new ListVisitor().visit(ctx.fieldNameList()),
                isFieldNameListType,
                'fieldNameList',
            ),
        );
    }
}

export const isElseClauseType = (
    target: ApexCommonTypeClass<string>,
): target is ElseClauseTypeClass => {
    return target instanceof ElseClauseTypeClass;
};

