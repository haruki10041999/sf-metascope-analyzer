import { JsonType } from '../../commons';
import type { FieldOrderTypeClass, OrderByClauseTypeClass } from '../../apex_IR';

import { makeNodeJson } from '../commons/node';
import { FieldBody, makeFieldBody } from './select';
import { SoqlFunctionBody, makeSoqlFunctionBody } from './soqlFunction';

export type FieldOrderJson = JsonType<'orderField'> &
    (FieldBody | SoqlFunctionBody) & {
        direction?: 'ASC' | 'DESC';
        nulls?: 'FIRST' | 'LAST';
    };

export const makeFieldOrderJson = (target: FieldOrderTypeClass): FieldOrderJson => {
    const { value, direction, nulls } = target.getFields();
    const result: FieldBody | SoqlFunctionBody =
        value.kind === 'fieldName' ? makeFieldBody(value) : makeSoqlFunctionBody(value);
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

/** ORDER BY の項目の並び */
export type OrderByJson = JsonType<'soqlOrderBy'> & {
    orderBy: FieldOrderJson[];
};

export const makeOrderByJson = (target: OrderByClauseTypeClass): OrderByJson => {
    const fieldOrderList = target.getFields().value;
    return makeNodeJson<OrderByJson>('soqlOrderBy', target, {
        orderBy: fieldOrderList.getFields().value.map((v) => makeFieldOrderJson(v)),
    });
};
