import typia from 'typia';

import { JsonType } from '../../commons';
import type { UpdateListTypeClass } from '../../apex_IR';

import { makeNodeJson } from '../commons/node';

export type UpdateListJson = JsonType<'updateClause'> & {
    value: ('TRACKING' | 'VIEWSTAT')[];
};

export const isUpdateListJson = typia.createIs<UpdateListJson>();

export const makeUpdateListJson = (target: UpdateListTypeClass): UpdateListJson => {
    return makeNodeJson<UpdateListJson>('updateClause', target, {
        value: target.getFields().value.map((v) => v.getFields().value),
    });
};
