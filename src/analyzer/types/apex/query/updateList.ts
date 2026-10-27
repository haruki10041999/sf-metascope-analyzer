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

import { UpdateListType, UpdateTypeType } from '../converter';

export type UpdateListJson = JsonType<'updateClause'> & {
    value: ('TRACKING' | 'VIEWSTAT')[];
};

export const isUpdateListJson = typia.createIs<UpdateListJson>();

export const makeUpdateListJson = (
    target: ConvertType<UpdateListType>,
    targetRecords?: Record<string, string[]>,
): UpdateListJson | ErrorJson => {
    return convertValue<'updateList', 'updateClause', UpdateListType, UpdateListJson>(
        ['updateList'],
        target,
        ['updateClause'],
        'updateClause',
        (target, targetRecords, _) => {
            return makeJsonType('updateClause', targetRecords, {
                value: target.value.map((v) => v.value),
            });
        },
        targetRecords,
    );
};
