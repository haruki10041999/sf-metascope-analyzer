// LWC の converter: lwc_IR (TypeClass) → CommonType (docs/lwc-parse-plan.md 3.1.2・3.1.6)。
// Apex の types/apex/converter と同じ層。CommonType は { type, sourceInfo, ...フィールド } の素のオブジェクトで、
// このあと makeConvertType (types/apex/commons) が objectKey / sourceKey を付ける。
// lwc_IR はクラスの形がそろっている (getFields) ので、Apex のノードごとの assign rule の代わりに 1 つの変換で書く
import { LwcCommonTypeClass, LwcErrorTypeClass, type ErrorCode } from '../../lwc_IR/commonVisitor';
import type { CommonType, SourceInfo } from '../../apex/converter/commons';
import type { FileTypeClass } from '../../lwc_IR/standardizedVisitor/file';

import type { LwcFileType } from './nodes';

/** ソース位置。sourceKey がファイルごとに別になるよう、ファイルのパスも持つ (2.4) */
export type LwcSourceInfo = SourceInfo & {
    /** バンドルのフォルダの親からの相対パス (hello/hello.ts) */
    filePath: string;
};

/** IR の 1 ノード。フィールドは Babel のフィールド名のまま持つ (子は LwcCommonType / LwcErrorType) */
export type LwcCommonType = CommonType<string> & {
    sourceInfo: LwcSourceInfo;
    [field: string]: unknown;
};

/** Apex の ErrorType と同じ形 */
export type LwcErrorType = CommonType<'error'> & {
    sourceInfo: LwcSourceInfo;
    errorCode: ErrorCode;
    contextType: string;
};

const EMPTY_POSITION = { offset: 0, line: 1, column: 0 };

// span は visitWithPairs が必ず付ける。付いていなければファイルの先頭にする
const makeLwcSourceInfo = (
    typeClass: LwcCommonTypeClass<string>,
    filePath: string,
): LwcSourceInfo => {
    const span = typeClass.getSpan();
    return {
        context: span?.context ?? '',
        start: span?.start ?? EMPTY_POSITION,
        end: span?.end ?? EMPTY_POSITION,
        filePath,
    };
};

export const makeLwcErrorType = (typeClass: LwcErrorTypeClass, filePath: string): LwcErrorType => ({
    type: 'error',
    errorCode: typeClass.getCode(),
    contextType: typeClass.getContextType(),
    sourceInfo: makeLwcSourceInfo(typeClass, filePath),
});

const convertValue = (value: unknown, filePath: string): unknown => {
    if (value instanceof LwcCommonTypeClass) {
        return convertLwcTypeClass(value, filePath);
    }
    if (Array.isArray(value)) {
        return value.map((item) => convertValue(item, filePath));
    }
    if (value !== null && typeof value === 'object') {
        // TemplateElement.value ({ raw, cooked }) など、ノードではないオブジェクト
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [key, convertValue(child, filePath)]),
        );
    }
    return value;
};

/** lwc_IR のノードを CommonType にする (子もすべて)。LwcErrorTypeClass は LwcErrorType にする */
export const convertLwcTypeClass = (
    typeClass: LwcCommonTypeClass<string>,
    filePath: string,
): LwcCommonType | LwcErrorType => {
    if (typeClass instanceof LwcErrorTypeClass) {
        return makeLwcErrorType(typeClass, filePath);
    }
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(typeClass.getFields())) {
        fields[key] = convertValue(value, filePath);
    }
    return {
        type: typeClass.getType(),
        sourceInfo: makeLwcSourceInfo(typeClass, filePath),
        ...fields,
    };
};

/**
 * File の IR → LwcFileType (Apex の makeCompilationUnitAssignRule などに当たる入口)。
 * 変換は convertLwcTypeClass と同じで、型だけを生成した LwcFileType (nodes.ts) にする
 */
export const convertLwcFile = (file: FileTypeClass, filePath: string): LwcFileType =>
    convertLwcTypeClass(file, filePath) as LwcFileType;
