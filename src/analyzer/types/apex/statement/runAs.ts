import { RunAsStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { BlockField, makeBlockField } from '../../../parser/Apex/extractor/block';

export type RunAsField = {
    kind: 'runAs';
    arg: ExpressionType[];
} & BlockField;

export const makeRunAsField = (runAsStatement: RunAsStatementClass): RunAsField | undefined => {
    const arg = runAsStatement
        .getValue()
        .map((v) => makeExpressionType(v))
        .filter((v) => v !== undefined);
    const block = makeBlockField(runAsStatement.getBlock());

    if (arg.length > 0 && block) {
        return {
            kind: 'runAs',
            arg: arg,
            ...block,
        };
    }

    return undefined;
};

