import {
    ErrorJson,
    JsonType,
    SingleConditionJson,
    WhereJson,
    isErrorJson,
} from '../../../../types';

import { ValueDiff, getValueKey, makeOptionalDiff, makeValueDiff, pairAsSet } from '../commons';

type WhereSingleJson =
    | (JsonType<'singleCondition'> & {
          field: string;
          operator: SingleConditionJson['operator'];
          value: SingleConditionJson['value'];
      })
    | SingleConditionJson;
export type LogicalCondition = {
    condition: (WhereSingleJson | LogicalCondition | ErrorJson)[];
    operator?: 'AND' | 'OR' | 'NOT';
};

export type ConditionItemDiff =
    | { status: 'unchanged'; index: { before: number; after: number }; value: unknown }
    | { status: 'removed'; index: number; value: unknown }
    | { status: 'added'; index: number; value: unknown };

export type LogicalConditionDiff =
    | ValueDiff<LogicalCondition | ErrorJson>
    | {
          status: 'changed';
          operator: import('../commons').OptionalDiff<
              'AND' | 'OR' | 'NOT',
              ValueDiff<'AND' | 'OR' | 'NOT'>
          >;
          condition:
              ConditionItemDiff[] | ValueDiff<(WhereSingleJson | LogicalCondition | ErrorJson)[]>;
      };

const makeConditionItemsDiff = (
    before: (WhereSingleJson | LogicalCondition | ErrorJson)[],
    after: (WhereSingleJson | LogicalCondition | ErrorJson)[],
): ConditionItemDiff[] => {
    const pairings = pairAsSet(before.map(getValueKey), after.map(getValueKey));
    return pairings.map((pairing): ConditionItemDiff => {
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

export const makeLogicalConditionDiff = (
    before: LogicalCondition | ErrorJson,
    after: LogicalCondition | ErrorJson,
): LogicalConditionDiff => {
    if (isErrorJson(before) || isErrorJson(after) || getValueKey(before) === getValueKey(after)) {
        return makeValueDiff(before, after);
    }

    return {
        status: 'changed',
        operator: makeOptionalDiff(before.operator, after.operator, makeValueDiff),
        condition:
            before.operator === 'NOT' || after.operator === 'NOT'
                ? makeValueDiff(before.condition, after.condition)
                : makeConditionItemsDiff(before.condition, after.condition),
    };
};

export type WhereDiff =
    | { condition: LogicalConditionDiff }
    | ValueDiff<{ condition: LogicalCondition | ErrorJson } | ErrorJson>;

export const makeWhereDiff = (
    before: WhereJson | ErrorJson,
    after: WhereJson | ErrorJson,
): WhereDiff => {
    if (isErrorJson(before) || isErrorJson(after)) return makeValueDiff(before, after);
    return { condition: makeLogicalConditionDiff(before.condition, after.condition) };
};
