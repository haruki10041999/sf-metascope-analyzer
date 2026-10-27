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
} from '..//commons';

import { ForClausesType } from '../converter';

export type ForJson = JsonType<'forClause'> & {
    value: string;
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (
    target: ConvertType<ForClausesType>,
    targetRecords?: Record<string, string[]>,
): ForJson | ErrorJson => {
    return convertValue<'forClauses', 'forClause', ForClausesType, ForJson>(
        ['forClauses'],
        target,
        ['forClause'],
        'forClause',
        (target, targetRecords, errorJson) => {
            const forJsons = target.value.map((v) => {
                const forJson: ForJson = makeJsonType('forClause', targetRecords, {
                    value: v,
                });

                return forJson;
            });

            return forJsons.length === 1 ? forJsons[0]! : errorJson;
        },
        targetRecords,
    );
};

