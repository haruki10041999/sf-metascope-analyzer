import { ElseClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { FieldNameListTypeClass, ListVisitor, isFieldNameListType } from '../listVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ElseClauseTypeClass extends ClauseTypeClass<FieldNameListTypeClass> {
    private constructor(value: FieldNameListTypeClass | ErrorTypeClass) {
        super('elseClause', value);
    }

    static create(ctx: ElseClauseContext): ElseClauseTypeClass {
        if (!ctx.fieldNameList()) {
            throw new Error('値が異常です。ElseClauseContext: ' + ctx.getText());
        }

        return new ElseClauseTypeClass(
            isValidClass(
                new ListVisitor().visit(ctx.fieldNameList()),
                isFieldNameListType,
                'fieldNameList',
            ),
        );
    }
}

export const isElseClauseType = (target: CommonTypeClass): target is ElseClauseTypeClass => {
    return target instanceof ElseClauseTypeClass;
};

