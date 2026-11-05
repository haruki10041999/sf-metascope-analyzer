import type { SourcePosition } from './source';
import { ErrorJson, JsonType } from './json';
import {
    SourceFile,
    SpanSourceInfo,
    SpanSourceJson,
    SpanSourceRegistry,
    findSpanSourceInfo,
    makeSpanErrorJson,
    makeSpanJson,
} from './spanJson';

import { XmlElement, childOf, childrenOf } from './xml';

// 方針: docs/metadata-json-reference.md
// kind / sourceKeys の付け方・ソース位置の登録は、HTML / CSS と共通の spanJson.ts (位置の範囲から JSON を作る部品)。
// XML の名前 (XmlFile / XmlSourceRegistry など) は、その別名として残す

/** ソース位置。1 つのオブジェクトは複数のファイルからなるので、Apex の SourceInfo にファイルのパスを足す */
export type XmlSourceInfo = SpanSourceInfo;

/** Apex の SourceJson と同じ形 (source の要素に filePath を足したもの) */
export type XmlSourceJson = SpanSourceJson;

/** 読み込み中の 1 ファイル。filePath はオブジェクトのフォルダの親からの相対パス (区切りは /) */
export type XmlFile = SourceFile;

/** 1 つのオブジェクトを読む間に集めるソース位置 */
export const XmlSourceRegistry = SpanSourceRegistry;
export type XmlSourceRegistry = SpanSourceRegistry;

export const findXmlSourceInfo = findSpanSourceInfo;

/**
 * kind / sourceKeys を付けた JSON を作り、ソース位置を登録する。
 * element が undefined のときは、ファイルの先頭を位置にする。
 * objectKey は書いた順のまま hash する (保存済みのメタデータのキーを変えないため。spanJson.ts の SpanJsonOptions)
 */
export const makeXmlJson = <T extends JsonType<string>>(
    kind: T['kind'],
    properties: Omit<T, 'kind' | 'sourceKeys'>,
    element: XmlElement | undefined,
    file: XmlFile,
    registry: XmlSourceRegistry,
): T => makeSpanJson<T>(kind, properties, element, file, registry, { sortKeys: false });

/** 読めなかったファイル・要素の ErrorJson。kindType は何として読もうとしたか (field など) */
export const makeXmlErrorJson = (
    kindType: string,
    message: string,
    position: SourcePosition,
    file: XmlFile,
    registry: XmlSourceRegistry,
): ErrorJson => makeSpanErrorJson(kindType, message, position, file, registry);

// ---------------------------------------------------------------------------
// 子要素の値を読む
// ---------------------------------------------------------------------------

/** プロパティ名 (= XML の要素名) と値の型 */
export type PropertySchema = Record<string, 'string' | 'boolean' | 'number'>;

export type PropertiesOf<S extends PropertySchema> = {
    [K in keyof S]?: S[K] extends 'boolean' ? boolean : S[K] extends 'number' ? number : string;
};

export const readText = (element: XmlElement, name: string): string | undefined =>
    childOf(element, name)?.text;

export const readTexts = (element: XmlElement, name: string): string[] =>
    childrenOf(element, name).map((child) => child.text);

/** 配列が空なら持たない { key: items }。ファイルにない要素はプロパティごと省く (値のプロパティと同じ扱い) */
export const nonEmptyEntry = <K extends string, T>(key: K, items: T[]): Partial<Record<K, T[]>> =>
    items.length === 0 ? {} : ({ [key]: items } as Record<K, T[]>);

/** schema にある子要素を読む。要素がないプロパティは持たない */
export const readProperties = <S extends PropertySchema>(
    element: XmlElement | undefined,
    schema: S,
): PropertiesOf<S> => {
    const properties: Record<string, string | boolean | number> = {};
    if (!element) {
        return properties as PropertiesOf<S>;
    }
    for (const [name, type] of Object.entries(schema)) {
        const text = readText(element, name);
        if (text === undefined) continue;
        if (type === 'boolean') {
            properties[name] = text === 'true';
        } else if (type === 'number') {
            const value = Number(text);
            properties[name] = Number.isNaN(value) ? text : value;
        } else {
            properties[name] = text;
        }
    }
    return properties as PropertiesOf<S>;
};

// ---------------------------------------------------------------------------
// 読み込んだファイルとルート要素
// ---------------------------------------------------------------------------

/**
 * 読み込んだ 1 ファイル。name はファイル名から接尾辞を除いたもの。
 * XML として読めなかったときは root を持たず、error に理由と位置を持つ
 */
export type ParsedXmlFile = XmlFile & {
    name: string;
    root?: XmlElement;
    error?: { message: string; position: SourcePosition };
};

/** 読めなかったファイル・想定と違うルート要素。FileStructureType の resolvedError にする */
export type XmlReadProblem = {
    code: 'XML_SYNTAX' | 'UNEXPECTED_ROOT';
    file: XmlFile;
    kindType: string;
    message: string;
    position: SourcePosition;
    error: ErrorJson;
};

/**
 * ファイルを読めたか、ルート要素が root かを確かめる。読めなければ ErrorJson を返し、problems に理由を足す。
 * kindType は何として読もうとしたか (field / apexClassMeta など)
 */
export const readXmlRoot = (
    file: ParsedXmlFile,
    root: string,
    kindType: string,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): XmlElement | ErrorJson => {
    const toError = (
        code: XmlReadProblem['code'],
        message: string,
        position: SourcePosition,
    ): ErrorJson => {
        const error = makeXmlErrorJson(kindType, message, position, file, registry);
        problems.push({ code, file, kindType, message, position, error });
        return error;
    };

    if (!file.root) {
        const error = file.error ?? {
            message: 'XML cannot be read',
            position: { offset: 0, line: 1, column: 0 },
        };
        return toError('XML_SYNTAX', error.message, error.position);
    }
    if (file.root.name !== root) {
        return toError(
            'UNEXPECTED_ROOT',
            `<${root}> expected but <${file.root.name}> found`,
            file.root.start,
        );
    }
    return file.root;
};
