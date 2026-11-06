import type { ErrorJson, JsonType } from '../commons/json';
import { childrenOf, type XmlElement } from '../commons/xml';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readTexts,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type PropertySchema,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';
import { toValueTree, type ValueTree } from '../commons/valueTree';

// 優先度 B・C の XML の種類の JSON の作り方。方針: docs/metadata-implementation.md 10 章
// 種類ごとの表 (RecordSpec) から JSON を作り、型も表から導く (RecordJson<typeof 表>)。
// - schema: 値の要素 (XML の要素名をプロパティ名にし、型をそろえる。ファイルにないものは持たない)
// - lists: 繰り返す値の要素 (文字列の並び)
// - trees: 入れ子の構造の要素 (共有先・条件の行など)。値の木 (types/commons/valueTree.ts) のまま持つ。
//   'one' は 1 つ、'many' は繰り返す (いつも配列)
// - children: 名前で対応付ける子 (Diff の D)。子も同じ形の表
// - 表にない要素は skippedElements に名前を残す

export type TreeSpec = Readonly<Record<string, 'one' | 'many'>>;

/** 名前で対応付ける子の表 */
export type RecordChildSpec = {
    kind: string;
    /** キーにする値の要素 (値を | でつなぐ) */
    key: readonly string[];
    schema: PropertySchema;
    lists?: readonly string[];
    trees?: TreeSpec;
};

/** 種類の表 */
export type RecordSpec = {
    kind: string;
    /** ルート要素 */
    root: string;
    schema: PropertySchema;
    lists?: readonly string[];
    trees?: TreeSpec;
    children?: Readonly<Record<string, RecordChildSpec>>;
};

type ListsOf<S extends { lists?: readonly string[] }> = {
    [L in NonNullable<S['lists']>[number]]?: string[];
};

type TreesOf<S extends { trees?: TreeSpec }> = {
    [T in keyof NonNullable<S['trees']>]?: NonNullable<S['trees']>[T] extends 'many'
        ? ValueTree[]
        : ValueTree;
};

type ValuesOf<S extends { schema: PropertySchema; lists?: readonly string[]; trees?: TreeSpec }> =
    PropertiesOf<S['schema']> & ListsOf<S> & TreesOf<S> & { skippedElements?: string[] };

/** 子の JSON */
export type RecordChildJson<C extends RecordChildSpec> = JsonType<C['kind']> & ValuesOf<C>;

type ChildrenOf<S extends RecordSpec> = {
    [E in keyof NonNullable<S['children']>]?: RecordChildJson<NonNullable<S['children']>[E]>[];
};

/**
 * 種類の JSON。fullName はファイル名から接尾辞を除いたもの (入れ子のフォルダは <フォルダ>/<名前>)。
 * XML の <name> (表示名) を持つ種類があるので、ファイルの名前は fullName にする
 */
export type RecordJson<S extends RecordSpec> = JsonType<S['kind']> & {
    fullName: string;
} & ValuesOf<S> &
    ChildrenOf<S>;

/** 子のキー (key の値がどれもなければ空文字。Diff では集合として比べる) */
export const recordChildKey = (spec: Pick<RecordChildSpec, 'key'>, child: object): string => {
    const values = spec.key.map((name) => String((child as Record<string, unknown>)[name] ?? ''));
    return values.some(Boolean) ? values.join('|') : '';
};

/** 値の要素・繰り返す値・入れ子の構造を読む (exclude の要素は読まない。子の表の要素など) */
const readValues = (
    element: XmlElement,
    spec: Pick<RecordSpec, 'schema' | 'lists' | 'trees'>,
    exclude: string[] = [],
): Record<string, unknown> => {
    const trees = Object.entries(spec.trees ?? {}).flatMap(([name, cardinality]) => {
        const items = childrenOf(element, name);
        if (!items.length) return [];
        const values = items.map((item) => toValueTree(item));
        return [[name, cardinality === 'many' ? values : values[0]!]];
    });
    const known = [
        ...Object.keys(spec.schema),
        ...(spec.lists ?? []),
        ...Object.keys(spec.trees ?? {}),
        ...exclude,
    ];
    return {
        ...readProperties(element, spec.schema),
        ...Object.fromEntries(
            (spec.lists ?? []).flatMap((name) => {
                const values = readTexts(element, name);
                return values.length ? [[name, values]] : [];
            }),
        ),
        ...Object.fromEntries(trees),
        ...nonEmptyEntry('skippedElements', unknownChildNames(element, known)),
    };
};

const readChildren = (
    element: XmlElement,
    children: RecordSpec['children'],
    file: XmlFile,
    registry: XmlSourceRegistry,
): Record<string, unknown> =>
    Object.fromEntries(
        Object.entries(children ?? {}).flatMap(([name, spec]) => {
            const items = childrenOf(element, name).map((child) =>
                makeMetadataJson<JsonType<string>>(
                    spec.kind,
                    readValues(child, spec) as Omit<JsonType<string>, 'kind' | 'sourceKeys'>,
                    child,
                    file,
                    registry,
                ),
            );
            return items.length ? [[name, items]] : [];
        }),
    );

/** ルート要素 (確かめ済みのもの) から JSON を作る。extra は種類ごとに足すプロパティ (本体のマークアップなど) */
export const makeRecordJsonFromRoot = <S extends RecordSpec>(
    spec: S,
    root: XmlElement,
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    extra: Record<string, unknown> = {},
): RecordJson<S> =>
    makeMetadataJson<JsonType<string>>(
        spec.kind,
        {
            fullName: file.name,
            ...readValues(root, spec, Object.keys(spec.children ?? {})),
            ...readChildren(root, spec.children, file, registry),
            ...extra,
        } as Omit<JsonType<string>, 'kind' | 'sourceKeys'>,
        root,
        file,
        registry,
    ) as RecordJson<S>;

/** 表から、読み込んだ XML を JSON にする関数を作る (MetadataFolderSpec の make) */
export const makeRecordJson =
    <S extends RecordSpec>(spec: S) =>
    (
        file: ParsedXmlFile,
        registry: XmlSourceRegistry,
        problems: XmlReadProblem[],
    ): RecordJson<S> | ErrorJson => {
        const root = readXmlRoot(file, spec.root, spec.kind, registry, problems);
        if (!('name' in root)) return root;
        return makeRecordJsonFromRoot(spec, root, file, registry);
    };
