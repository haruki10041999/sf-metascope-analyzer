import { TryStatementClass, CatchClauseClass } from '../converter';
import { makeModifierType, ModifierType } from '../modifier';

import { StatementType, makeBlockField } from './statement';

type TryBlock =
    | {
          type: 'try' | 'finally';
          block: StatementType[];
      }
    | {
          type: 'catch';
          exception: string;
          excepstionType: string[];
          modifier?: ModifierType;
          block: StatementType[];
      };

export type TryField = {
    kind: 'try';
    block: TryBlock[];
};

export const makeTryField = (tryStatement: TryStatementClass): TryField | undefined => {
    const tryBlocks: TryBlock[] = [];

    const tryBlock = makeBlockField(tryStatement.getValue());
    if (tryBlock) {
        tryBlocks.push({
            type: 'try',
            block: tryBlock,
        });
    }

    tryStatement.getCatchBlock().forEach((c) => {
        const exception = c.getValue();
        const exceptionType = c.getValueType();
        const block = makeBlockField(c.getBlock());
        const modifier = makeModifierType(c.getModifier());

        if (exception && exceptionType && block) {
            const catchBlock: TryBlock = {
                type: 'catch',
                exception: exception,
                excepstionType: exceptionType,
                block: block,
            };

            if (modifier) {
                catchBlock.modifier = modifier;
            }

            tryBlocks.push(catchBlock);
        }
    });

    const finallyBlock = makeBlockField(tryStatement.getFinallyBlock());
    if (finallyBlock) {
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
