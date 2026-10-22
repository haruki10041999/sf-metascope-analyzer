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
} from '../commons';

import { ForClausesType } from '../converter';

export type ForJson = JsonType & {
    kind: 'for';
    value: string;
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (
    target: Convert<ForClausesType>,
    sourceObject: SourceJson[],
): ForJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);

    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);
    const error: ErrorJson = {
        kind: 'error',
        kindType: 'for',
        sourceKeys: {},
    };
    writeSourceKeys(error, targetObjectKey, targetSourceKey);

    if (isError(convertJsons)) {
        return error;
    }

    const value = castExcludeErrorInfoArray(target.value);

    if (value.length === 1) {
        const forJson: ForJson = {
            kind: 'for',
            sourceKeys: {},
            value: value[0]!,
        };
        writeSourceKeys(forJson, targetObjectKey, targetSourceKey);
        return forJson;
    }

    return error;
};
