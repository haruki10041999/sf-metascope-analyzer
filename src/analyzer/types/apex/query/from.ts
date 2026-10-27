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

import { FromNameListType } from '../converter';

export type FromJson = JsonType<'fromClause'> & {
    field: string[];
    alias?: string;
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (
    target: ConvertType<FromNameListType>,
    targetRecords?: Record<string, string[]>,
): FromJson | ErrorJson => {
    return convertValue<'fromNameList', 'fromClause', FromNameListType, FromJson>(
        ['fromNameList'],
        target,
        ['fromClause'],
        'fromClause',
        (target, targetRecords, errorJson) => {
            const fromJsons = target.value.map((v) => {
                const fromJson: FromJson = makeJsonType('fromClause', targetRecords, {
                    field: v.value.value.map((item) => item.value.value),
                });

                if (v.alias) {
                    fromJson.alias = v.alias.value.value;
                }

                return fromJson;
            });

            return fromJsons.length === 1 ? fromJsons[0]! : errorJson;
        },
        targetRecords,
    );
};

