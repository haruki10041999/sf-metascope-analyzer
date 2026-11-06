import path from 'node:path';

import { type ParsedXmlFile, type SourceText, type XmlElement } from '../../types';
import { parseXmlSource } from '../commons';

// 分解された形式 (decomposed。sfdx-project.json の decomposePermissionSetBeta2 / decomposeCustomLabelsBeta2 /
// decomposeWorkflowBeta / decomposeSharingRulesBeta など) を、1 つの XML の単位に組み立てる。
// 要素は元のファイルを持つ (XmlElement.file) ので、ソース位置は元のファイルのまま。方針: docs/analysis-plan.md 5.3

export type DecomposedSpec = {
    /**
     * folder: <フォルダ>/<名前>/ の下のファイルが 1 単位 (権限セット・ワークフロー・共有ルール)。
     * all: <フォルダ>/ の直下の分解されたファイルすべてが 1 単位 (カスタム表示ラベル)
     */
    unit: 'folder' | 'all';
    /** all のときの単位の名前 (CustomLabels) */
    name?: string;
    /** 組み立てたルート要素の名前 (PermissionSet など) */
    root: string;
    /**
     * 分解されたファイルの接尾辞 → 組み立てたルートの中の要素名。
     * 要素名が undefined のファイルは、ルートの子をそのまま足す (権限セットの objectSettings など)
     */
    children: Readonly<Record<string, string | undefined>>;
};

/** ファイル名が、分解されたファイルの接尾辞のどれか */
export const decomposedSuffixOf = (spec: DecomposedSpec, fileName: string): string | undefined =>
    Object.keys(spec.children)
        .sort((a, b) => b.length - a.length)
        .find((suffix) => fileName.endsWith(suffix));

const attachFile = (
    element: XmlElement,
    file: { filePath: string; source: string },
): XmlElement => ({
    ...element,
    file,
    children: element.children.map((child) => attachFile(child, file)),
});

/**
 * 分解されたファイル (files。filePath は結果に残すパス) を、1 つの XML のファイルに組み立てる。
 * main は単位のファイル (<名前><接尾辞>。なければ undefined)。読めないファイルがあれば、そのファイルを返す
 * (resolvedError になる)
 */
export const assembleDecomposed = (
    spec: DecomposedSpec,
    name: string,
    unitPath: string,
    main: SourceText | undefined,
    files: SourceText[],
): ParsedXmlFile => {
    const parsed = [...(main ? [main] : []), ...files.filter((file) => file !== main)].map(
        (file) => ({
            file,
            xml: parseXmlSource(file.filePath, file.source.replace(/\r\n?/g, '\n'), name),
        }),
    );
    const broken = parsed.find(({ xml }) => !xml.root);
    if (broken) return broken.xml;

    const children: XmlElement[] = [];
    for (const { file, xml } of parsed) {
        const root = attachFile(xml.root!, { filePath: file.filePath, source: xml.source });
        const suffix =
            file === main
                ? undefined
                : decomposedSuffixOf(spec, path.posix.basename(file.filePath));
        const elementName = suffix ? spec.children[suffix] : undefined;
        if (elementName) children.push({ ...root, name: elementName });
        else children.push(...root.children);
    }
    const mainXml = parsed.find(({ file }) => file === main)?.xml;
    const start = mainXml?.root?.start ?? { offset: 0, line: 1, column: 0 };
    return {
        filePath: main?.filePath ?? unitPath,
        source: mainXml?.source ?? '',
        name,
        root: {
            name: spec.root,
            attributes: mainXml?.root?.attributes ?? {},
            children,
            text: '',
            start,
            end: mainXml?.root?.end ?? start,
            ...(mainXml ? { file: { filePath: mainXml.filePath, source: mainXml.source } } : {}),
        },
    };
};
