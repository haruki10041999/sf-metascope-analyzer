import typia from 'typia';

import { ErrorJson, JsonType, makeJsonType, convertValue, ConvertType } from '../commons';

import { ForClausesType } from '../converter';

export type ForJson = JsonType<'forClause'> & {
    value: string[];
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (target: ConvertType<ForClausesType>): ForJson | ErrorJson => {
    return convertValue<'forClauses', ForClausesType, ForJson>(
        target,
        'forClause',
        (target, targetRecords) => {
            return makeJsonType('forClause', targetRecords.base, {
                value: target.value,
            });
        },
    );
};

