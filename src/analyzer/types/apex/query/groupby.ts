import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type { FieldGroupByTypeClass, GroupByClauseTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
import { LogicalConditionJson, makeLogicalConditionJson } from './commons';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

const makeGroupByFieldJson = (target: FieldGroupByTypeClass): FieldJson | SoqlFunctionJson => {
    const value = target.getFields().value;
    switch (value.kind) {
        case 'fieldName':
            return makeFieldJson(value);
        case 'soqlFunction':
            return makeSoqlFunctionJson(value);
    }
};

export type GroupByJson = JsonType<'groupBy'> & {
    field: (FieldJson | SoqlFunctionJson)[];
    mode?: 'ROLLUP' | 'CUBE';
    having?: LogicalConditionJson | ErrorJson;
};

export const isGroupByJson = typia.createIs<GroupByJson>();

export const makeGroupByJson = (target: GroupByClauseTypeClass): GroupByJson => {
    const { value, mode, having } = target.getFields();
    return makeNodeJson<GroupByJson>('groupBy', target, {
        field: value.getFields().value.map((v) => makeGroupByFieldJson(v)),
        ...(mode ? { mode: mode } : {}),
        ...(having ? { having: makeLogicalConditionJson(having) } : {}),
    });
};
