import { FieldJson, SoqlFunctionJson } from '../../../../types';

import { getValueKey, pairAsSequence, pairAsSet } from '../commons';
import { FieldDiff, makeFieldDiff } from './select';
import { SoqlFunctionDiff, makeSoqlFunctionDiff } from './soqlFunction';

export type ValueListItemDiff<T> =
    | { status: 'unchanged'; index: { before: number; after: number }; value: T }
    | { status: 'removed'; index: number; value: T }
    | { status: 'added'; index: number; value: T };

export const makeUnorderedValueListDiff = <T>(before: T[], after: T[]): ValueListItemDiff<T>[] => {
    const pairings = pairAsSet(before.map(getValueKey), after.map(getValueKey));
    return pairings.map((pairing): ValueListItemDiff<T> => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }
        return {
            status: 'unchanged',
            index: { before: pairing.before, after: pairing.after },
            value: before[pairing.before]!,
        };
    });
};

export type FieldTerm = FieldJson | SoqlFunctionJson;

export type FieldTermDiff =
    { type: 'field'; value: FieldDiff } | { type: 'soqlFunction'; value: SoqlFunctionDiff };

export type FieldTermListItemDiff =
    | {
          status: 'unchanged' | 'moved';
          index: { before: number; after: number };
          value: FieldTerm;
      }
    | {
          status: 'changed';
          index: { before: number; after: number };
          value: FieldTermDiff | { before: FieldTerm; after: FieldTerm };
      }
    | { status: 'removed' | 'added'; index: number; value: FieldTerm };

export const makeFieldTermDiff = (
    before: FieldTerm,
    after: FieldTerm,
): FieldTermDiff | undefined => {
    if (before.type !== after.type) return undefined;
    if (before.type === 'field' && after.type === 'field') {
        return { type: 'field', value: makeFieldDiff(before, after) };
    }
    if (before.type === 'soqlFunction' && after.type === 'soqlFunction') {
        return { type: 'soqlFunction', value: makeSoqlFunctionDiff(before, after) };
    }
    return undefined;
};

export const makeFieldTermSequenceDiff = (
    before: FieldTerm[],
    after: FieldTerm[],
): FieldTermListItemDiff[] => {
    const pairings = pairAsSequence(before.map(getValueKey), after.map(getValueKey));
    return pairings.map((pairing): FieldTermListItemDiff => {
        if (pairing.status === 'removed') {
            return { status: 'removed', index: pairing.before, value: before[pairing.before]! };
        }
        if (pairing.status === 'added') {
            return { status: 'added', index: pairing.after, value: after[pairing.after]! };
        }
        const index = { before: pairing.before, after: pairing.after };
        const beforeField = before[pairing.before]!;
        const afterField = after[pairing.after]!;
        if (pairing.status === 'moved') return { status: 'moved', index, value: beforeField };
        if (pairing.status === 'unchanged')
            return { status: 'unchanged', index, value: beforeField };
        return {
            status: 'changed',
            index,
            value: makeFieldTermDiff(beforeField, afterField) ?? {
                before: beforeField,
                after: afterField,
            },
        };
    });
};

export type { ConditionItemDiff, LogicalConditionDiff } from './where';
