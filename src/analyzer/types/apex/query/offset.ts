import typia from 'typia';

import { ErrorJson, JsonType, makeJsonType, convertValue, ConvertType } from '../commons';

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

export const makeOffsetJson = (target: ConvertType<OffsetClauseType>): OffsetJson | ErrorJson => {
    return convertValue<'offsetClause', OffsetClauseType, OffsetJson>(
        target,
        'offsetClause',
        (target, targetRecords) => {
            if (typeof target.value === 'string') {
                return makeJsonType('offsetClause', targetRecords.base, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJsonConvert(target.value.value);
                return makeJsonType('offsetClause', targetRecords.base, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
    );
};

