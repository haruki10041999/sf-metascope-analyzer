import typia from 'typia';

import { ErrorJson, JsonType, makeJsonType, convertValue, ConvertType } from '../commons';

import { AllRowsClauseType } from '../converter';

export type AllRowsJson = JsonType<'allRowsClause'> & {
    value: string;
};

export const isAllRowsJson = typia.createIs<AllRowsJson>();

export const makeAllRowsJson = (
    target: ConvertType<AllRowsClauseType>,
): AllRowsJson | ErrorJson => {
    return convertValue<'allRowsClause', AllRowsClauseType, AllRowsJson>(
        target,
        'allRowsClause',
        (target, targetRecords) => {
            return makeJsonType('allRowsClause', targetRecords.base, {
                value: target.value,
            });
        },
    );
};

