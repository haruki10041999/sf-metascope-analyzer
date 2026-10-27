import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
    convertValue,
    ConvertType,
    StructureJsonType,
    makeStructureJsonType,
} from '../commons';

import { LimitClauseType } from '../converter';
import { ExpressionJson, makeExpressionJson } from '../expression';

export type LimitJson = JsonType<'limitClause'> &
    (
        | {
              type: 'literal';
              value: string;
          }
        | {
              type: 'bind';
              value: ExpressionJson;
          }
    );

export const isLimitJson = typia.createIs<LimitJson>();

export const makeLimitJson = (
    target: ConvertType<LimitClauseType>,
    targetRecords?: Record<string, string[]>,
): LimitJson | ErrorJson => {
    return convertValue<'limitClause', 'limitClause', LimitClauseType, LimitJson>(
        ['limitClause'],
        target,
        ['limitClause'],
        'limitClause',
        (target, targetRecords, _) => {
            if (typeof target.value === 'string') {
                return makeJsonType('limitClause', targetRecords, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJson(target.value.value);
                return makeJsonType('limitClause', targetRecords, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
        targetRecords,
    );
};
