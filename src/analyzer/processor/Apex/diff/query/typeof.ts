import { TypeOfBlockJson, TypeOfJson } from '../../../../types';

import { ValueDiff, getValueKey, isSameValue, makeValueDiff, pairAsSequence } from '../commons';
import { FieldPathDiff, makeFieldPathDiff } from './select';

export type TypeOfBlockFieldsDiff = {
    object: ValueDiff<TypeOfBlockJson['object']>;
    field: ValueDiff<string[][]>;
};

export type TypeOfBlockDiff =
    | {
          status: 'unchanged' | 'moved';
          index: { before: number; after: number };
          value: TypeOfBlockJson;
      }
    | {
          status: 'changed';
          index: { before: number; after: number };
          fields: TypeOfBlockFieldsDiff;
      }
    | { status: 'added' | 'removed'; index: number; value: TypeOfBlockJson };

export type TypeOfDiff = {
    type: 'typeOf';
    field: FieldPathDiff;
    block: TypeOfBlockDiff[];
};

const makeTypeOfBlocksDiff = (
    before: TypeOfBlockJson[],
    after: TypeOfBlockJson[],
): TypeOfBlockDiff[] => {
    const pairings = pairAsSequence(
        before.map((block) => getValueKey(block.object)),
        after.map((block) => getValueKey(block.object)),
    );

    return pairings.map((pairing): TypeOfBlockDiff => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }

        const index = { before: pairing.before, after: pairing.after };
        const beforeBlock = before[pairing.before]!;
        const afterBlock = after[pairing.after]!;
        if (pairing.status === 'moved') return { status: 'moved', index, value: beforeBlock };
        if (isSameValue(beforeBlock, afterBlock)) {
            return { status: 'unchanged', index, value: beforeBlock };
        }
        return {
            status: 'changed',
            index,
            fields: {
                object: makeValueDiff(beforeBlock.object, afterBlock.object),
                field: makeValueDiff(beforeBlock.field, afterBlock.field),
            },
        };
    });
};

export const makeTypeOfDiff = (before: TypeOfJson, after: TypeOfJson): TypeOfDiff => ({
    type: 'typeOf',
    field: makeFieldPathDiff(before.field, after.field),
    block: makeTypeOfBlocksDiff(before.block, after.block),
});
