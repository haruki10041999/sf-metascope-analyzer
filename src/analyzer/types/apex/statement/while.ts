import { WhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { BlockField } from './block';
import { StatementType, makeStatementType } from './statement';

export type WhileField = {
    kind: 'while';
    condition: ExpressionType;
} & (BlockField | { block: StatementType });

export const makeWhileField = (whileStatement: WhileStatementClass): WhileField | undefined => {
    const condition = makeExpressionType(whileStatement.getValue());
    const block = makeStatementType(whileStatement.getBlock());

    let blockField: BlockField | { block: StatementType } | undefined = undefined;
    if (block) {
        if (!('kind' in block)) {
            blockField = block;
        } else {
            blockField = { block: block };
        }
    }

    if (condition && blockField) {
        return {
            kind: 'while',
            condition: condition,
            ...blockField,
        };
    }

    return undefined;
};

