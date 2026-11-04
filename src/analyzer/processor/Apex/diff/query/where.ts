import {
    ErrorJson,
    JsonType,
    SingleConditionJson,
    WhereJson,
    isErrorJson,
} from '../../../../types';

import {
    ValueDiff,
    getValueKey,
    makeOptionalDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { TypedListDiff } from '../../../commons/diff/list';
import { makeUnorderedValueListDiff } from './commons';

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

type ConditionItem = WhereSingleJson | LogicalCondition | ErrorJson;

export type LogicalConditionJsonDiff =
    | ValueDiff<LogicalCondition | ErrorJson>
    | {
          status: 'changed';
          operator: import('../../../commons/diff/commons').OptionalDiff<
              'AND' | 'OR' | 'NOT',
              ValueDiff<'AND' | 'OR' | 'NOT'>
          >;
          condition: TypedListDiff<ConditionItem, never> | ValueDiff<ConditionItem[]>;
      };

/** AND / OR の項は B. 集合 */
const makeConditionItemsDiff = (
    before: ConditionItem[],
    after: ConditionItem[],
): TypedListDiff<ConditionItem, never> => makeUnorderedValueListDiff(before, after);

export const makeLogicalConditionDiff = (
    before: LogicalCondition | ErrorJson,
    after: LogicalCondition | ErrorJson,
): LogicalConditionJsonDiff => {
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

export type WhereJsonDiff =
    | { condition: LogicalConditionJsonDiff }
    | ValueDiff<{ condition: LogicalCondition | ErrorJson } | ErrorJson>;

export const makeWhereDiff = (
    before: WhereJson | ErrorJson,
    after: WhereJson | ErrorJson,
): WhereJsonDiff => {
    if (isErrorJson(before) || isErrorJson(after)) return makeValueDiff(before, after);
    return { condition: makeLogicalConditionDiff(before.condition, after.condition) };
};
