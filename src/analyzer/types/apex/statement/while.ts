import typia from 'typia';

import { WhileStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { BlockField, isBlockField } from '../../../parser/Apex/extractor/block';
import { StatementType, makeStatementType } from './statement';

export type WhileField = {
    kind: 'while';
    condition: ExpressionType;
} & (BlockField | { block: StatementType });

export const isWhileField = typia.createIs<WhileField>;

export const makeWhileField = (whileStatement: WhileStatementClass): WhileField | undefined => {
    const condition = makeExpressionType(whileStatement.getValue());
    const block = makeStatementType(whileStatement.getBlock());

    let blockField: BlockField | { block: StatementType } | undefined = undefined;
    if (block) {
        if (isBlockField(block)) {
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

