import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    JsonType,
    SourceJson,
    searchConvertAll,
    isError,
    writeSourceKeys,
    removeSourceInfo,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
    isErrorJson,
} from './commons';

import { BaseExpressionType } from './converter';

export type ExpressionJson = {
    value: string;
};

export const isExpressionJson = typia.createIs<ExpressionJson>();

export const makeExpressionJson = (target: Convert<BaseExpressionType>): ExpressionJson => {
    return {
        value: '',
    };
};
