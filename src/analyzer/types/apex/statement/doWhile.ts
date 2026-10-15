import { DoWhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { BlockField, makeBlockField } from './block';

export type DoWhileField = {
    kind: 'doWhile';
    condition: ExpressionType;
} & BlockField;

export const makeDoWhileField = (
    dowhileStatement: DoWhileStatementClass,
): DoWhileField | undefined => {
    const condition = makeExpressionType(dowhileStatement.getValue());
    const block = makeBlockField(dowhileStatement.getBlock());

    if (condition && block) {
        return {
            kind: 'doWhile',
            condition: condition,
            ...block,
        };
    }

    return undefined;
};

