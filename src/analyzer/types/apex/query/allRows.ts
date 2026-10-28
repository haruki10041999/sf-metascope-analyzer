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
} from '../commons';

import { AllRowsClauseType } from '../converter';

export type AllRowsJson = JsonType<'allRowsClause'> & {
    value: string;
};

export const isAllRowsJson = typia.createIs<AllRowsJson>();

export const makeAllRowsJson = (
    target: ConvertType<AllRowsClauseType>,
    targetRecords?: Record<string, string[]>,
): AllRowsJson | ErrorJson => {
    return convertValue<'allRowsClause', AllRowsClauseType, AllRowsJson>(
        ['allRowsClause'],
        target,
        'allRowsClause',
        (target, targetRecords) => {
            return makeJsonType('allRowsClause', targetRecords, {
                value: target.value,
            });
        },
        targetRecords,
    );
};
