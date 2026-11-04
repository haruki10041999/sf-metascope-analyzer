import { ErrorJson, JsonType } from '../commons/json';
import {
    ParsedXmlFile,
    PropertiesOf,
    XmlReadProblem,
    XmlSourceRegistry,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readXmlRoot,
} from '../commons/xmlJson';
import { childrenOf } from '../commons/xml';

// Apex のクラス・トリガーのメタデータ (<名前>.cls-meta.xml / <名前>.trigger-meta.xml)。
// 方針: docs/metadata-json-reference.md と同じ (XML の要素名をプロパティ名にし、ファイルにないものは持たない)

export const APEX_META_SCHEMA = {
    /** API バージョン。61.0 のような値なので文字列のまま持つ (数値にすると 61 になる) */
    apiVersion: 'string',
    /** Active / Inactive / Deleted */
    status: 'string',
} as const;

/** 管理パッケージのバージョン (`<packageVersions>`)。namespace で識別する */
export type PackageVersionJson = { namespace: string; majorNumber?: number; minorNumber?: number };

type ApexMetaBody = {
    packageVersions?: PackageVersionJson[];
} & PropertiesOf<typeof APEX_META_SCHEMA>;

/** クラスのメタデータ (`<ApexClass>`) */
export type ApexClassMetaJson = JsonType<'apexClassMeta'> & ApexMetaBody;

/** トリガーのメタデータ (`<ApexTrigger>`) */
export type ApexTriggerMetaJson = JsonType<'apexTriggerMeta'> & ApexMetaBody;

export type ApexMetaJson = ApexClassMetaJson | ApexTriggerMetaJson;

/** メタデータのファイルの接尾辞と、kind・ルート要素の対応 */
export const APEX_META_FILES = {
    '.cls-meta.xml': { kind: 'apexClassMeta', root: 'ApexClass' },
    '.trigger-meta.xml': { kind: 'apexTriggerMeta', root: 'ApexTrigger' },
} as const;

export type ApexMetaSuffix = keyof typeof APEX_META_FILES;

export const getApexMetaSuffix = (fileName: string): ApexMetaSuffix | undefined =>
    (Object.keys(APEX_META_FILES) as ApexMetaSuffix[]).find((suffix) =>
        fileName.toLowerCase().endsWith(suffix),
    );

/** 読み込んだ -meta.xml を JSON にする。読めない・ルート要素が違うときは ErrorJson (理由は problems) */
export const makeApexMetaJson = (
    suffix: ApexMetaSuffix,
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): ApexMetaJson | ErrorJson => {
    const { kind, root } = APEX_META_FILES[suffix];
    const element = readXmlRoot(file, root, kind, registry, problems);
    if (!('name' in element)) {
        return element;
    }
    return makeXmlJson<ApexMetaJson>(
        kind,
        {
            ...readProperties(element, APEX_META_SCHEMA),
            ...nonEmptyEntry(
                'packageVersions',
                childrenOf(element, 'packageVersions').map((version) => ({
                    namespace: readText(version, 'namespace') ?? '',
                    ...readProperties(version, { majorNumber: 'number', minorNumber: 'number' }),
                })),
            ),
        },
        element,
        file,
        registry,
    );
};

