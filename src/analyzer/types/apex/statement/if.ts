import { IfStatementClass, isExpressionClass, isString } from '../converter';

import { StatementType, makeStatementType } from './statement';
import { ExpressionType, makeExpressionType } from '../expression';

type IfBlock = {
    condition: ExpressionType | 'else';
    block: StatementType;
};

export type IfField = {
    kind: 'if';
    block: IfBlock[];
};

export const makeIfField = (statement: IfStatementClass[]): IfField | undefined => {
    const ifBlock: IfBlock[] = [];

    statement.forEach((s) => {
        const condition = s.getValue();
        const block = makeStatementType(s.getBlock());

        if (condition && block) {
            if (isExpressionClass(condition)) {
                return {
                    condition: makeExpressionType(condition),
                    block: block,
                };
            }

            if (isString(condition) && condition.toLocaleLowerCase() === 'else') {
                return {
                    condition: 'else',
                    block: block,
                };
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
