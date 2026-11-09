import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type { LimitClauseTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
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

export const makeLimitJson = (target: LimitClauseTypeClass): LimitJson => {
    const value = target.getFields().value;
    switch (value.kind) {
        case 'literal':
            return makeNodeJson<LimitJson>('limitClause', target, {
                type: 'literal',
                value: value.value,
            });
        case 'bind':
            // バインド式 (:var) は中の式を出す
            return makeNodeJson<LimitJson>('limitClause', target, {
                type: 'bind',
                value: makeExpressionJsonConvert(value.value.getFields().value),
            });
    }
};
