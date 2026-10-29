import typia from 'typia';

import { ErrorJson, JsonType, makeJsonType, convertValue, ConvertType } from '../commons';

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

export const makeLimitJson = (target: ConvertType<LimitClauseType>): LimitJson | ErrorJson => {
    return convertValue<'limitClause', LimitClauseType, LimitJson>(
        target,
        'limitClause',
        (target, targetRecords) => {
            if (typeof target.value === 'string') {
                return makeJsonType('limitClause', targetRecords.base, {
                    type: 'literal',
                    value: target.value,
                });
            } else {
                const expressionJson = makeExpressionJsonConvert(target.value.value);
                return makeJsonType('limitClause', targetRecords.base, {
                    type: 'bind',
                    value: expressionJson,
                });
            }
        },
    );
};

