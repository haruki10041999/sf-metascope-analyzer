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

import { OffsetClauseType } from '../converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

export type OffsetJson = JsonType<'offsetClause'> &
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

export const isOffsetJson = typia.createIs<OffsetJson>();

export const makeOffsetJson = (
    target: ConvertType<OffsetClauseType>,
    targetRecords?: Record<string, string[]>,
): OffsetJson | ErrorJson => {
    return convertValue<'offsetClause', OffsetClauseType, OffsetJson>(
        ['offsetClause'],
        target,
        'offsetClause',
        (target, targetRecords) => {
            if (typeof target.value === 'string') {
                return makeJsonType('offsetClause', targetRecords, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJsonConvert(target.value.value);
                return makeJsonType('offsetClause', targetRecords, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
        targetRecords,
    );
};
