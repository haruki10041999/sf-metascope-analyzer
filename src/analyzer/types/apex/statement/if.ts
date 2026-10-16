import typia from 'typia';

import { IfStatementClass, isExpressionClass, isString } from '../converter';

import { StatementType, makeStatementType } from './statement';
import { BlockField, isBlockField } from '../../../parser/Apex/extractor/block';
import { ExpressionType, makeExpressionType } from '../expression';

type IfBlock = {
    condition: ExpressionType | 'else';
} & (BlockField | { block: StatementType });

export type IfField = {
    kind: 'if';
    block: IfBlock[];
};

export const isIfField = typia.createIs<IfField>;

export const makeIfField = (statement: IfStatementClass[]): IfField | undefined => {
    const ifBlock: IfBlock[] = [];

    statement.forEach((s) => {
        const condition = s.getValue();
        const block = makeStatementType(s.getBlock());

        let blockField: BlockField | { block: StatementType } | undefined = undefined;
        if (block) {
            if (isBlockField(block)) {
                blockField = block;
            } else {
                blockField = { block: block };
            }
        }

        if (condition && blockField) {
            if (isExpressionClass(condition)) {
                const expression = makeExpressionType(condition);
                if (expression) {
                    ifBlock.push({
                        condition: expression,
                        ...blockField,
                    });
                }
            }

            if (isString(condition) && condition.toLocaleLowerCase() === 'else') {
                ifBlock.push({
                    condition: 'else',
                    ...blockField,
                });
            }
        }
    });

    if (ifBlock.length > 0) {
        return {
            kind: 'if',
            block: ifBlock,
        };
    }

    return undefined;
};

