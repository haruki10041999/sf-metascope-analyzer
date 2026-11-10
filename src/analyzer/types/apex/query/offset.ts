import typia from 'typia';

import { JsonType } from '../../commons';
import type { OffsetClauseTypeClass } from '../../apex_IR';

import { makeNodeJson } from '../commons/node';
import { BaseExpressionJson, makeExpressionJsonConvert } from '../expression';

export type OffsetJson = JsonType<'offsetClause'> &
    (
        | {
              type: 'literal';
              value: string;
          }
        | {
              type: 'bind';
              value: BaseExpressionJson;
          }
    );

export const isOffsetJson = typia.createIs<OffsetJson>();

export const makeOffsetJson = (target: OffsetClauseTypeClass): OffsetJson => {
    const value = target.getFields().value;
    switch (value.kind) {
        case 'literal':
            return makeNodeJson<OffsetJson>('offsetClause', target, {
                type: 'literal',
                value: value.value,
            });
        case 'bind':
            // バインド式 (:var) は中の式を出す
            return makeNodeJson<OffsetJson>('offsetClause', target, {
                type: 'bind',
                value: makeExpressionJsonConvert(value.value.getFields().value),
            });
    }
};
