// クラス・トリガーのメタデータ (<名前>.cls-meta.xml / <名前>.trigger-meta.xml) 1 つの解析。
// ファイルシステムには触らない (読み込みは folder.ts)
import {
    type JsonType,
    XmlSourceRegistry,
    getApexMetaSuffix,
    makeApexMetaJson,
    makeXmlJson,
    type ApexMetaJson,
    type XmlReadProblem,
    type XmlSourceJson,
} from '../../types';
import { parseXmlSource, toXmlResolvedError, type XmlResolvedError } from '../commons';

/**
 * -meta.xml の JSON。読めない・ルート要素が違うときは meta が null (理由は resolvedError)。
 * ファイルの入れ物のノード (apex 9 から)。位置はファイルの先頭
 */
export type ApexMetaFileJson = JsonType<'apexMetaFile'> & {
    /** ファイル名 (Foo.cls-meta.xml) */
    fileName: string;
    meta: ApexMetaJson | null;
};

export type ApexMetaParseResult = {
    meta: ApexMetaFileJson;
    sourceObject: XmlSourceJson[];
    resolvedError: XmlResolvedError[];
};

/** -meta.xml 1 つを解析する。ソース位置のファイルのパスは、実行環境に依らないようファイル名にする */
export const parseApexMetaSource = (fileName: string, source: string): ApexMetaParseResult => {
    const suffix = getApexMetaSuffix(fileName);
    if (!suffix) {
        throw new Error(`not an Apex metadata file: ${fileName}`);
    }
    const file = parseXmlSource(fileName, source, fileName.slice(0, -suffix.length));
    const registry = new XmlSourceRegistry();
    const problems: XmlReadProblem[] = [];
    const meta = makeApexMetaJson(suffix, file, registry, problems);
    return {
        meta: makeXmlJson<ApexMetaFileJson>(
            'apexMetaFile',
            { fileName, meta },
            undefined,
            file,
            registry,
        ),
        sourceObject: registry.toSourceObjects(),
        resolvedError: problems.map(toXmlResolvedError),
    };
};
