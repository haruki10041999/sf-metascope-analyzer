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

import { FromNameType, FromNameListType } from '../converter';

type FromFieldJson = JsonType<'fromField'> & {
    field: string[];
    alias?: string;
};

const makeFromFieldJson = (
    target: ConvertType<FromNameType>,
    targetRecords?: Record<string, string[]>,
): FromFieldJson | ErrorJson => {
    return convertValue<'fromName', FromNameType, FromFieldJson>(
        ['fromName'],
        target,
        'fromField',
        (target, targetRecords) => {
            const fromFieldJson: FromFieldJson = makeJsonType('fromField', targetRecords, {
                field: target.value.value.map((item) => item.value.value),
            });

            if (target.alias) {
                fromFieldJson.alias = target.alias.value.value;
            }

            return fromFieldJson;
        },
        targetRecords,
    );
};

export type FromJson = {
    field: (FromFieldJson | ErrorJson)[];
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (target: ConvertExcludeError<FromNameListType>): FromJson => {
    return {
        field: target.value.map((v) => makeFromFieldJson(v)),
    };
};

