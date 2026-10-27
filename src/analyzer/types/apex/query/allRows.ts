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

import { AllRowsClauseType } from '../converter';
import { ExpressionJson, makeExpressionJson } from '../expression';

export type AllRowsJson = JsonType<'allRowsClause'> & {
    value: string;
};

export const isAllRowsJson = typia.createIs<AllRowsJson>();

export const makeAllRowsJson = (
    target: ConvertType<AllRowsClauseType>,
    targetRecords?: Record<string, string[]>,
): AllRowsJson | ErrorJson => {
    return convertValue<'allRowsClause', 'allRowsClause', AllRowsClauseType, AllRowsJson>(
        ['allRowsClause'],
        target,
        ['allRowsClause'],
        'allRowsClause',
        (target, targetRecords, _) => {
            return makeJsonType('allRowsClause', targetRecords, {
                value: target.value,
            });
        },
        targetRecords,
    );
};
