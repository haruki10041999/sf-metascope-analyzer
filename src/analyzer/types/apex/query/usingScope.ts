import typia from 'typia';

import { ErrorJson, JsonType, makeJsonType, convertValue, ConvertType } from '../commons';

import { UsingScopeType } from '../converter';

export type UsingScopeJson = JsonType<'usingScopeClause'> & {
    value: string;
};
export const isUsingScopeJson = typia.createIs<UsingScopeJson>();

export const makeUsingScopeJson = (
    target: ConvertType<UsingScopeType>,
): UsingScopeJson | ErrorJson => {
    return convertValue<'usingScope', UsingScopeType, UsingScopeJson>(
        target,
        'usingScopeClause',
        (target, targetRecords) => {
            return makeJsonType('usingScopeClause', targetRecords.base, {
                value: target.value.value.value,
            });
        },
    );
};

