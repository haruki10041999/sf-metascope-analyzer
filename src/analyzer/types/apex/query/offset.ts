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

import { OffsetClauseType } from '../converter';
import { ExpressionJson, makeExpressionJson } from '../expression';

export type OffsetJson = JsonType<'offsetClause'> &
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

export const isOffsetJson = typia.createIs<OffsetJson>();

export const makeOffsetJson = (
    target: ConvertType<OffsetClauseType>,
    targetRecords?: Record<string, string[]>,
): OffsetJson | ErrorJson => {
    return convertValue<'offsetClause', 'offsetClause', OffsetClauseType, OffsetJson>(
        ['offsetClause'],
        target,
        ['offsetClause'],
        'offsetClause',
        (target, targetRecords, _) => {
            if (typeof target.value === 'string') {
                return makeJsonType('offsetClause', targetRecords, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJson(target.value.value);
                return makeJsonType('offsetClause', targetRecords, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
        targetRecords,
    );
};
