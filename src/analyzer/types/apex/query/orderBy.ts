import { ErrorJson, JsonType } from '../../commons';
import type { FieldOrderTypeClass, OrderByClauseTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
import { FieldJson, makeFieldJson } from './select';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';

export type FieldOrderJson = JsonType<'orderField'> &
    (FieldJson | SoqlFunctionJson) & {
        direction?: 'ASC' | 'DESC';
        nulls?: 'FIRST' | 'LAST';
    };

export const makeFieldOrderJson = (target: FieldOrderTypeClass): FieldOrderJson => {
    const { value, direction, nulls } = target.getFields();
    const result: FieldJson | SoqlFunctionJson =
        value.kind === 'fieldName' ? makeFieldJson(value) : makeSoqlFunctionJson(value);
    const finalResult = makeNodeJson<FieldOrderJson>('orderField', target, {
        ...result,
    });

    if (direction) {
        finalResult.direction = direction;
    }
    if (nulls) {
        finalResult.nulls = nulls;
    }
    return finalResult;
};

export type OrderByJson = {
    orderBy: (FieldOrderJson | ErrorJson)[];
};

export const makeOrderByJson = (target: OrderByClauseTypeClass): OrderByJson => {
    const fieldOrderList = target.getFields().value;
    return {
        orderBy: fieldOrderList.getFields().value.map((v) => makeFieldOrderJson(v)),
    };
};
