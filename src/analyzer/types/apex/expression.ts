import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    GenerateResult,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    collectDelteteKeys,
    mergeRecord,
    isConvert,
} from './commons';

import { BaseExpressionType } from './converter';

export type ExpressionJson = {
    value: string;
};

export const isExpressionJson = typia.createIs<ExpressionJson>();

export const makeExpressionJson = (
    target: ConvertExcludeError<BaseExpressionType>,
): ExpressionJson => {
    return {
        value: '',
    };
};
