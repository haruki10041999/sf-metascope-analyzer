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
    isConvert,
} from '..//commons';

import { ForClausesType } from '../converter';

export type ForJson = JsonType & {
    kind: 'forClause';
    value: string;
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (target: Convert<ForClausesType>): ForJson | ErrorJson => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };

    const { value, errorInfos } = convertExcludeError<ForClausesType>(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'forClause' });

    if (!value || errorInfos.length > 0) {
        return error;
    }
    if (value.value.length === 1) {
        return makeJsonType('forClause', targetRecords, {
            value: value.value[0]!,
        });
    }

    return error;
};
