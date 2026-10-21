import crypto from 'node:crypto';

import typia from 'typia';

import { SourceInfo, ErrorInfo, CommonType, isSourceInfo, isErrorInfo } from './converter';

export type JsonType<T> = {
    objectKey: string;
    sourceKey: string;
} & T;

export type SourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<SourceInfo, 'context'>)[];
};

export type CommonTypeExtractSourceInfo<T> = T extends CommonType
    ? Omit<T, 'sourceInfo'>
    : T extends readonly (infer TItem)[]
      ? CommonTypeExtractSourceInfo<TItem>[]
      : T extends object
        ? { [K in keyof T]: CommonTypeExtractSourceInfo<T[K]> }
        : T;

export const isCommonWithoutSourceInfo = <T extends CommonType>(
    target: unknown,
    isType: (target: unknown) => target is T,
): target is Omit<T, 'sourceInfo'> => {
    if (!isType(target)) {
        return false;
    }

    return !Object.hasOwn(target, 'sourceInfo');
};

const isCommonType = typia.createIs<CommonType>();

export const extractSourceInfo = <T>(target: T): CommonTypeExtractSourceInfo<T> => {
    if (Array.isArray(target))
        return target.map((item) => extractSourceInfo(item)) as CommonTypeExtractSourceInfo<T>;

    if (target === null || typeof target !== 'object') {
        return target as CommonTypeExtractSourceInfo<T>;
    }

    if (isCommonType(target)) {
        const { sourceInfo, ...rest } = target;
        return rest as CommonTypeExtractSourceInfo<T>;
    }

    const node = target as Record<string, unknown>;
    return Object.fromEntries(
        Object.entries(node)
            .filter(([_, value]) => !isSourceInfo(value))
            .map(([key, child]) => [key, extractSourceInfo(child)]),
    ) as CommonTypeExtractSourceInfo<T>;
};

const registerSourceJson = (
    sourceJson: SourceJson[],
    objectKey: string,
    sourceKey: string,
    sourceInfo: SourceInfo,
) => {
    const { context, ...content } = sourceInfo;
    const sourceObject = sourceJson.find((item) => item.objectKey === objectKey);

    if (!sourceObject) {
        sourceJson.push({
            objectKey,
            context: context,
            source: [{ sourceKey, ...content }],
        });
    } else {
        sourceObject.source.push({ sourceKey, ...content });
    }
};

export const makeHashKeyAndSplit = async <T extends CommonType>(
    commonType: T,
    sourceObject: SourceJson[],
): Promise<{
    objectKey: string;
    sourceKey: string;
    content: CommonTypeExtractSourceInfo<T>;
}> => {
    const commonTypeExtractSourceInfo = extractSourceInfo(commonType);
    const { type, ...content } = commonTypeExtractSourceInfo;

    const contentJson = JSON.stringify(content);
    const commonSourceJson = JSON.stringify(commonType.sourceInfo);

    const objextHash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(contentJson),
    );
    const objectHashHex = Array.from(new Uint8Array(objextHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    const objectKey = `${type}_${objectHashHex}`;

    const sourceHash = await crypto.webcrypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(commonSourceJson),
    );
    const sourceHashHex = Array.from(new Uint8Array(sourceHash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    registerSourceJson(sourceObject, objectKey, sourceHashHex, commonType.sourceInfo);

    return {
        objectKey: objectKey,
        sourceKey: sourceHashHex,
        content: commonTypeExtractSourceInfo,
    };
};

export const outputError = <T, TOutput>(
    target: T | ErrorInfo,
    process: (target: T) => TOutput,
): TOutput | ErrorInfo => {
    if (isErrorInfo(target)) {
        return target;
    }
    return process(target);
};

export const outputErrorList = <T, TOutput>(
    targets: (T | ErrorInfo)[],
    process: (target: T) => TOutput,
): (TOutput | ErrorInfo)[] => {
    return targets.map((target) => outputError(target, process));
};
