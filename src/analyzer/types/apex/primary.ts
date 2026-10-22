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

import { BasePrimaryType } from './converter';

export type PrimaryJson = {
    value: string;
};

export const isPrimaryJson = typia.createIs<PrimaryJson>();

export const makePrimaryJson = (target: Convert<BasePrimaryType>): PrimaryJson => {
    return {
        value: '',
    };
};
