import { TryStatementClass, CatchClauseClass } from '../converter';
import { makeModifierType, ModifierType } from '../modifier';

import { StatementType, makeStatementType } from './statement';

type TryBlock =
    | {
          type: 'try' | 'finally';
          block: StatementType[];
      }
    | {
          type: 'catch';
          exception: string;
          exceptionType: string[];
          modifier?: ModifierType;
          block: StatementType[];
      };

export type TryField = {
    kind: 'try';
    block: TryBlock[];
};

export const makeTryField = (tryStatement: TryStatementClass): TryField | undefined => {
    const tryBlocks: TryBlock[] = [];

    const tryBlock = tryStatement
        .getValue()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);
    if (tryBlock) {
        tryBlocks.push({
            type: 'try',
            block: tryBlock,
        });
    }

    tryStatement.getCatchBlock().forEach((c) => {
        const exception = c.getValue();
        const exceptionType = c.getValueType();
        const block = c
            .getBlock()
            .map((b) => makeStatementType(b))
            .filter((b) => b !== undefined);
        const modifier = makeModifierType(c.getModifier());

        if (exception && exceptionType && block) {
            const catchBlock: TryBlock = {
                type: 'catch',
                exception: exception,
                exceptionType: exceptionType,
                block: block,
            };

            if (modifier) {
                catchBlock.modifier = modifier;
            }

            tryBlocks.push(catchBlock);
        }
    });

    const finallyStatements = tryStatement.getFinallyBlock();
    if (finallyStatements.length > 0) {
        const finallyBlock = finallyStatements
            .map((b) => makeStatementType(b))
            .filter((b) => b !== undefined);
        tryBlocks.push({
            type: 'finally',
            block: finallyBlock,
        });
    }

    if (tryBlocks.length > 0) {
        return {
            kind: 'try',
            block: tryBlocks,
        };
    }

    return undefined;
};
