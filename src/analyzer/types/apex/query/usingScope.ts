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

import { UsingScopeType } from '../converter';

export type UsingScopeJson = JsonType<'usingScopeClause'> & {
    value: string;
};
export const isUsingScopeJson = typia.createIs<UsingScopeJson>();

export const makeUsingScopeJson = (
    target: ConvertType<UsingScopeType>,
    targetRecords?: Record<string, string[]>,
): UsingScopeJson | ErrorJson => {
    return convertValue<'usingScope', 'usingScopeClause', UsingScopeType, UsingScopeJson>(
        ['usingScope'],
        target,
        ['usingScopeClause'],
        'usingScopeClause',
        (target, targetRecords, _) => {
            return makeJsonType('usingScopeClause', targetRecords, {
                value: target.value.value.value,
            });
        },
        targetRecords,
    );
};
