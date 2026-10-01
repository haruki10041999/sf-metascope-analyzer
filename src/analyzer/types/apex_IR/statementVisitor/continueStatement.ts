import { ContinueStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import { CommonTypeClass } from '../commonVisitor';

export class ContinueStatementTypeClass extends StatementTypeClass<string> {
    private constructor(value: string | null) {
        super('continueStatement', value, {});
    }

    static create(ctx: ContinueStatementContext) {
        if (!ctx.CONTINUE()) {
            throw new Error('値が異常です。ContinueStatementContext: ' + ctx.getText());
        }

        return new ContinueStatementTypeClass(ctx.CONTINUE().getText());
    }
}

export const isContinueStatementType = (
    target: CommonTypeClass,
): target is ContinueStatementTypeClass => {
    return target instanceof ContinueStatementTypeClass;
};

