import typia from 'typia';

import { TryStatementClass, CatchClauseClass } from '../converter';
import { makeModifierType, ModifierType } from '../modifier';

import { BlockField, makeBlockField } from '../../../parser/Apex/extractor/block';

type TryBlock = (
    | {
          type: 'try' | 'finally';
      }
    | {
          type: 'catch';
          exception: string;
          exceptionType: string[];
          modifier?: ModifierType;
      }
) &
    BlockField;

export type TryField = {
    kind: 'try';
    block: TryBlock[];
};

export const isTryField = typia.createIs<TryField>();

export const makeTryField = (tryStatement: TryStatementClass): TryField | undefined => {
    const tryBlocks: TryBlock[] = [];

    const tryBlock = makeBlockField(tryStatement.getValue());
    if (tryBlock) {
        tryBlocks.push({
            type: 'try',
            ...tryBlock,
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
                exceptionType: exceptionType,
                ...block,
            };

            if (modifier) {
                catchBlock.modifier = modifier;
            }

            tryBlocks.push(catchBlock);
        }
    });

    const finallyStatements = tryStatement.getFinallyBlock();
    if (finallyStatements.length > 0) {
        const finallyBlock = makeBlockField(finallyStatements);
        if (finallyBlock) {
            tryBlocks.push({
                type: 'finally',
                ...finallyBlock,
            });
        }
    }

    if (tryBlocks.length > 0) {
        return {
            kind: 'try',
            block: tryBlocks,
        };
    }

    return undefined;
};
