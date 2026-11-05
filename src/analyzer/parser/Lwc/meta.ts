// LWC のバンドルの設定 (<名前>.js-meta.xml) の読み込み (docs/lwc-parse-plan.md 3.5)。
// XML の読み取り・JSON の作り方は、Apex の -meta.xml・オブジェクトと同じ部品を使う
import {
    XmlSourceRegistry,
    makeLwcBundleMetaJson,
    type ErrorJson,
    type LwcBundleMetaJson,
    type SpanSourceJson,
    type XmlReadProblem,
} from '../../types';
import { parseXmlSource } from '../commons';

import { LwcCommonErrorListener, type LwcResolvedError } from './errorListener';
import { LWC_META_SUFFIX } from './folder';

export type LwcBundleMetaParseResult = {
    /** バンドルのフォルダの親からの相対パス (hello/hello.js-meta.xml) */
    filePath: string;
    /** XML として読めない・ルート要素が LightningComponentBundle でないときは ErrorJson */
    meta: LwcBundleMetaJson | ErrorJson;
    sourceObjects: SpanSourceJson[];
    resolvedError: LwcResolvedError[];
};

/** 1 つの js-meta.xml を読む。filePath はバンドルのフォルダの親からの相対パス */
export const parseBundleMeta = (filePath: string, source: string): LwcBundleMetaParseResult => {
    const name = filePath.slice(filePath.lastIndexOf('/') + 1, -LWC_META_SUFFIX.length);
    const file = parseXmlSource(filePath, source, name);
    const registry = new XmlSourceRegistry();
    const problems: XmlReadProblem[] = [];
    const meta = makeLwcBundleMetaJson(file, registry, problems);

    const listener = new LwcCommonErrorListener(source);
    problems.forEach((problem) => listener.xmlProblem(problem));

    return {
        filePath,
        meta,
        sourceObjects: registry.toSourceObjects(),
        resolvedError: listener.getResolvedErrors(filePath),
    };
};

/** API バージョンを数値にする (61.0 → 61)。読めなければ undefined */
export const apiVersionOf = (
    meta: LwcBundleMetaJson | ErrorJson | undefined,
): number | undefined => {
    if (!meta || meta.kind !== 'lwcBundleMeta' || meta.apiVersion === undefined) return undefined;
    const version = Number(meta.apiVersion);
    return Number.isFinite(version) ? Math.trunc(version) : undefined;
};
