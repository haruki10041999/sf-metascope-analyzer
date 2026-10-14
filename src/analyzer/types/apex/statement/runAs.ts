import { RunAsStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { StatementType, makeStatementType } from './statement';

export type RunAsField = {
    kind: 'runAs';
    arg: ExpressionType[];
    block: StatementType[];
};

export const makeRunAsField = (runAsStatement: RunAsStatementClass): RunAsField | undefined => {
    const arg = runAsStatement
        .getValue()
        .map((v) => makeExpressionType(v))
        .filter((v) => v !== undefined);
    const block = runAsStatement
        .getBlock()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);

    if (arg.length > 0 && block) {
        return {
            kind: 'runAs',
            arg: arg,
            block: block,
        };
    }

    return undefined;
};
