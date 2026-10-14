import { WhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { StatementType, makeStatementType } from './statement';

export type WhileField = {
    type: 'while';
    condition: ExpressionType;
    block: StatementType;
};

export const makeWhileField = (whileStatement: WhileStatementClass): WhileField | undefined => {
    const condition = makeExpressionType(whileStatement.getValue());
    const block = makeStatementType(whileStatement.getBlock());

    if (condition && block) {
        return {
            type: 'while',
            condition: condition,
            block: block,
        };
    }

    return undefined;
};
