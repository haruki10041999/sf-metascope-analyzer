import typia from 'typia';

import { convertValue, ConvertType } from '../commons';
import { ErrorJson, JsonType, makeJsonType } from '../../commons';

import { UpdateListType, UpdateTypeType } from '../converter';

export type UpdateListJson = JsonType<'updateClause'> & {
    value: ('TRACKING' | 'VIEWSTAT')[];
};

export const isUpdateListJson = typia.createIs<UpdateListJson>();

export const makeUpdateListJson = (
    target: ConvertType<UpdateListType>,
): UpdateListJson | ErrorJson => {
    return convertValue<'updateList', UpdateListType, UpdateListJson>(
        target,
        'updateClause',
        (target, targetRecords) => {
            return makeJsonType('updateClause', targetRecords.base, {
                value: target.value.map((v) => v.value),
            });
        },
    );
};
