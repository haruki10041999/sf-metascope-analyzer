import typia from 'typia';

import { convertValue, ConvertType } from '../commons';
import { ErrorJson, JsonType, makeJsonType } from '../../commons';

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
