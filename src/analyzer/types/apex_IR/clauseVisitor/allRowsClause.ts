import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

import { ClauseValueTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class AllRowsClauseTypeClass extends ClauseValueTypeClass<'allRowsClause', string> {
    private constructor(value: string) {
        super('allRowsClause', value);
    }

    static create(ctx: AllRowsClauseContext): AllRowsClauseTypeClass {
        if (!ctx.ALL() || !ctx.ROWS()) {
            throw new Error('値が異常です。AllRowsClauseContext: ' + ctx.getText());
        }

        return new AllRowsClauseTypeClass(ctx.ALL().getText() + ' ' + ctx.ROWS().getText());
    }
}

export const isAllRowsClauseType = (
    target: CommonTypeClass<string>,
): target is AllRowsClauseTypeClass => {
    return target instanceof AllRowsClauseTypeClass;
};
