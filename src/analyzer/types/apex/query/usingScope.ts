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

import { UsingScopeType } from '../converter';

export type UsingScopeJson = JsonType & {
    kind: 'usingScope';
    value: string;
};
export const isUsingScopeJson = typia.createIs<UsingScopeJson>();

export const makeUsingScopeJson = (
    target: Convert<UsingScopeType>,
    sourceObject: SourceJson[],
): UsingScopeJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);

    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);
    const error: ErrorJson = {
        kind: 'error',
        kindType: 'usingScope',
        sourceKeys: {},
    };
    writeSourceKeys(error, targetObjectKey, targetSourceKey);
    if (isError(convertJsons)) {
        return error;
    }

    const value = castConvert(
        castExcludeErrorInfo(castConvert(castExcludeErrorInfo(target.value)).value),
    ).value;

    const usingScopeJson: UsingScopeJson = {
        kind: 'usingScope',
        sourceKeys: {},
        value: value,
    };
    writeSourceKeys(usingScopeJson, targetObjectKey, targetSourceKey);
    return usingScopeJson;
};
