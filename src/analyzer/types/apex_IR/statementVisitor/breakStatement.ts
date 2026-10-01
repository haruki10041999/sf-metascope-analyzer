import { BreakStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class BreakStatementTypeClass extends StatementTypeClass<string> {
    private constructor(value: string | null) {
        super('breakStatement', value, {});
    }

    static create(ctx: BreakStatementContext) {
        if (!ctx.BREAK()) {
            throw new Error('値が異常です。BreakStatementContext: ' + ctx.getText());
        }

        return new BreakStatementTypeClass(ctx.BREAK().getText());
    }
}

export const isBreakStatementType = (
    target: CommonTypeClass,
): target is BreakStatementTypeClass => {
    return target instanceof BreakStatementTypeClass;
};

