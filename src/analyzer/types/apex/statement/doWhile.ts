import { DoWhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { StatementType, makeStatementType } from './statement';

export type DoWhileField = {
    type: 'doWhile';
    condition: ExpressionType;
    block: StatementType[];
};

export const makeDoWhileField = (
    dowhileStatement: DoWhileStatementClass,
): DoWhileField | undefined => {
    const condition = makeExpressionType(dowhileStatement.getValue());
    const block = dowhileStatement
        .getBlock()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);

    if (condition && block) {
        return {
            type: 'doWhile',
            condition: condition,
            block: block,
        };
    }

    return undefined;
};
