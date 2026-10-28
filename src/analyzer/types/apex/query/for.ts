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
} from '..//commons';

import { ForClausesType } from '../converter';

export type ForJson = JsonType<'forClause'> & {
    value: string[];
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (
    target: ConvertType<ForClausesType>,
    targetRecords?: Record<string, string[]>,
): ForJson | ErrorJson => {
    return convertValue<'forClauses', ForClausesType, ForJson>(
        ['forClauses'],
        target,
        'forClause',
        (target, targetRecords) => {
            return makeJsonType('forClause', targetRecords, {
                value: target.value,
            });
        },
        targetRecords,
    );
};

