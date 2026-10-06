import { AllRowsClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class AllRowsClauseTypeClass extends ClauseTypeClass<string> {
    private constructor(value: string | ErrorTypeClass) {
        super('allRowClause', value);
    }

    static create(ctx: AllRowsClauseContext): AllRowsClauseTypeClass {
        if (!ctx.ALL() || !ctx.ROWS()) {
            throw new Error('値が異常です。AllRowsClauseContext: ' + ctx.getText());
        }

        return new AllRowsClauseTypeClass(ctx.ALL().getText() + ' ' + ctx.ROWS().getText());
    }
}

export const isAllRowsClauseType = (target: CommonTypeClass): target is AllRowsClauseTypeClass => {
    return target instanceof AllRowsClauseTypeClass;
};
