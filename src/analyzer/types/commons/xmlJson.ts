import type { SourcePosition } from './source';
import { ConvertKeys, ErrorJson, JsonType } from './json';
import { hash, isRecord } from './utils';

import { XmlElement, childOf, childrenOf } from './xml';

// 方針: docs/metadata-json-reference.md
// kind / sourceKeys の付け方は Apex (types/apex/commons/convert.ts) と同じ。
// - objectKey: `${kind}_${hash(内容)}`。内容は sourceKeys を除いたもの (子の内容を含む)。位置が変わっても変わらない
// - sourceKey: `${kind}_${hash(ファイルと開始・終了位置)}`。位置が変わると変わる

/** ソース位置。1 つのオブジェクトは複数のファイルからなるので、Apex の SourceInfo にファイルのパスを足す */
export type XmlSourceInfo = {
    context: string;
    filePath: string;
    start: SourcePosition;
    end: SourcePosition;
};

/** Apex の SourceJson と同じ形 (source の要素に filePath を足したもの) */
export type XmlSourceJson = {
    objectKey: string;
    context: string;
    source: ({ sourceKey: string } & Omit<XmlSourceInfo, 'context'>)[];
};

/** 読み込み中の 1 ファイル。filePath はオブジェクトのフォルダの親からの相対パス (区切りは /) */
export type XmlFile = {
    filePath: string;
    source: string;
};

/** 1 つのオブジェクトを読む間に集めるソース位置 */
export class XmlSourceRegistry {
    private readonly sourceObjects = new Map<string, XmlSourceJson>();

    register(keys: ConvertKeys, info: XmlSourceInfo): void {
        const { context, ...content } = info;
        const sourceObject = this.sourceObjects.get(keys.objectKey);
        if (!sourceObject) {
            this.sourceObjects.set(keys.objectKey, {
                objectKey: keys.objectKey,
                context,
                source: [{ sourceKey: keys.sourceKey, ...content }],
            });
        } else if (!sourceObject.source.some((s) => s.sourceKey === keys.sourceKey)) {
            sourceObject.source.push({ sourceKey: keys.sourceKey, ...content });
        }
    }

    toSourceObjects(): XmlSourceJson[] {
        return [...this.sourceObjects.values()];
    }
}

export const findXmlSourceInfo = (
    sourceObject: XmlSourceJson[],
    keys: ConvertKeys,
): XmlSourceInfo => {
    const object = sourceObject.find((o) => o.objectKey === keys.objectKey);
    const source = object?.source.find((s) => s.sourceKey === keys.sourceKey);
    if (!object || !source) {
        throw new Error('sourceInfo cannot be found');
    }
    const { sourceKey: _sourceKey, ...content } = source;
    return { context: object.context, ...content };
};

/** objectKey の計算用に、子孫の sourceKeys を除く */
const stripSourceKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stripSourceKeys);
    }
    if (isRecord(value)) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== 'sourceKeys')
                .map(([key, child]) => [key, stripSourceKeys(child)]),
        );
    }
    return value;
};

/** 要素がない (object-meta.xml がないなど) ときの位置。ファイルの先頭 */
const FILE_START: SourcePosition = { offset: 0, line: 1, column: 0 };

/**
 * kind / sourceKeys を付けた JSON を作り、ソース位置を登録する。
 * element が undefined のときは、ファイルの先頭を位置にする
 */
export const makeXmlJson = <T extends JsonType<string>>(
    kind: T['kind'],
    properties: Omit<T, 'kind' | 'sourceKeys'>,
    element: XmlElement | undefined,
    file: XmlFile,
    registry: XmlSourceRegistry,
): T => {
    const start = element?.start ?? FILE_START;
    const end = element?.end ?? FILE_START;
    const sourceKeys: ConvertKeys = {
        objectKey: `${kind}_${hash(stripSourceKeys(properties))}`,
        sourceKey: `${kind}_${hash({ filePath: file.filePath, start, end })}`,
    };
    registry.register(sourceKeys, {
        context: file.source.slice(start.offset, end.offset),
        filePath: file.filePath,
        start,
        end,
    });
    return { kind, sourceKeys, ...properties } as unknown as T;
};

/** 読めなかったファイル・要素の ErrorJson。kindType は何として読もうとしたか (field など) */
export const makeXmlErrorJson = (
    kindType: string,
    message: string,
    position: SourcePosition,
    file: XmlFile,
    registry: XmlSourceRegistry,
): ErrorJson => {
    const sourceKeys: ConvertKeys = {
        objectKey: `error_${hash({ kindType, message })}`,
        sourceKey: `error_${hash({ filePath: file.filePath, position })}`,
    };
    registry.register(sourceKeys, {
        context: file.source,
        filePath: file.filePath,
        start: position,
        end: position,
    });
    return { kind: 'error', sourceKeys, kindType };
};

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
