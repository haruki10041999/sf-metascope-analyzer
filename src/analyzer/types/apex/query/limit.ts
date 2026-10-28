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
} from '../commons';

import { LimitClauseType } from '../converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

export type LimitJson = JsonType<'limitClause'> &
    (
        | {
              type: 'literal';
              value: string;
          }
        | {
              type: 'bind';
              value: BaseExpressionJson | ErrorJson;
          }
    );

export const isLimitJson = typia.createIs<LimitJson>();

export const makeLimitJson = (
    target: ConvertType<LimitClauseType>,
    targetRecords?: Record<string, string[]>,
): LimitJson | ErrorJson => {
    return convertValue<'limitClause', LimitClauseType, LimitJson>(
        ['limitClause'],
        target,
        'limitClause',
        (target, targetRecords) => {
            if (typeof target.value === 'string') {
                return makeJsonType('limitClause', targetRecords, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJsonConvert(target.value.value);
                return makeJsonType('limitClause', targetRecords, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
        targetRecords,
    );
};
