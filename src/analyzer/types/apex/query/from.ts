import typia from 'typia';

import {
    Convert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
} from '../commons';

import { FromNameListType } from '../converter';

export type FromJson = JsonType & {
    kind: 'fromClause';
    field: string[];
    alias?: string;
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (target: Convert<FromNameListType>): FromJson | ErrorJson => {
    const targetRecords: Record<string, string[]> = { [target.objectKey]: [target.sourceKey] };

    const { value, errorInfos } = convertExcludeError<FromNameListType>(target);

    const error: ErrorJson = makeJsonType('error', targetRecords, { kindType: 'type' });

    if (!value || errorInfos.length > 0) {
        return error;
    }

    const froms: {
        field: string[];
        alias?: string;
    }[] = value.value.map((from) => {
        const fromName = from.value.value.map((item) => item.value.value);

        const alias = from.alias ? from.alias.value.value : null;

        const value: {
            field: string[];
            alias?: string;
        } = {
            field: fromName,
        };
        if (alias) {
            value.alias = alias;
        }
        return value;
    });

    if (froms.length === 1) {
        const fromJson: FromJson = makeJsonType('fromClause', targetRecords, {
            field: froms[0]!.field,
        });
        if (froms[0]!.alias) {
            fromJson.alias = froms[0]!.alias;
        }

        return fromJson;
    }

    return error;
};
