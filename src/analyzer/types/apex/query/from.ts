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

import { FromNameListType } from '../converter';

export type FromJson = JsonType & {
    kind: 'from';
    from: {
        field: string[];
        alias?: string;
    };
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (
    target: Convert<FromNameListType>,
    sourceObject: SourceJson[],
): FromJson | ErrorJson => {
    const targetObjectKey = target.objectKey;
    const targetSourceKey = target.sourceKey;
    const convertJsons = searchConvertAll(target);

    removeSourceInfo(sourceObject, convertJsons, [targetSourceKey]);
    const error: ErrorJson = {
        kind: 'error',
        kindType: 'from',
        sourceKeys: {},
    };
    writeSourceKeys(error, targetObjectKey, targetSourceKey);
    if (isError(convertJsons)) {
        return error;
    }

    const _target = target as Convert<FromNameListType>;
    const fromList = castConvertArray(castExcludeErrorInfoArray(_target.value));

    const froms: {
        field: string[];
        alias?: string;
    }[] = fromList.map((from) => {
        const fromName = castConvertArray(
            castExcludeErrorInfoArray(castConvert(castExcludeErrorInfo(from.value)).value),
        ).map((item) => castConvert(castExcludeErrorInfo(item.value)).value);

        const alias = from.alias
            ? castConvert(castExcludeErrorInfo(castConvert(castExcludeErrorInfo(from.alias)).value))
                  .value
            : null;

        const value: {
            field: string[];
            alias?: string;
        } = {
            field: fromName,
        };
        if (alias) {
            value.alias = alias;
        }
        return value;
    });

    if (froms.length === 1) {
        const fromJson: FromJson = {
            kind: 'from',
            sourceKeys: {},
            from: froms[0]!,
        };

        writeSourceKeys(fromJson, targetObjectKey, targetSourceKey);
        return fromJson;
    }

    return error;
};
