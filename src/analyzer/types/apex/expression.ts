import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
} from './commons';

import { BaseExpressionType } from './converter';

export type ExpressionJson = {
    value: string;
};

export const isExpressionJson = typia.createIs<ExpressionJson>();

export const makeExpressionJson = (
    target: ConvertExcludeError<BaseExpressionType>,
): ExpressionJson => {
    if (target.type === 'expression') {
        return {
            value: target.value,
        };
    }
};
