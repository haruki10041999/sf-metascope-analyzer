import { DoWhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { BlockField, makeBlockField } from './statement';

export type DoWhileField = {
    type: 'doWhile';
    condition: ExpressionType;
    block: BlockField;
};

export const makeDoWhileField = (
    dowhileStatement: DoWhileStatementClass,
): DoWhileField | undefined => {
    const condition = makeExpressionType(dowhileStatement.getValue());
    const block = makeBlockField(dowhileStatement.getBlock());

    if (condition && block) {
        return {
            type: 'doWhile',
            condition: condition,
            block: block,
        };
    }

    return undefined;
};
