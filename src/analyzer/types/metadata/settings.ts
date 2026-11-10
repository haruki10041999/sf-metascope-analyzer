import type { JsonType } from '../commons/json';
import { toValueTreeProperties, type ValueTreeProperties } from '../commons/valueTree';
import {
    makeMetadataJson,
    readXmlRoot,
    type ParsedXmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// 組織の設定 (settings/<名前>.settings-meta.xml)。方針: docs/metadata-implementation.md 10 章
// ルート要素はファイル名ごとに違い (Case.settings-meta.xml → <CaseSettings>)、要素も種類ごとにかなり違うので、
// 表 (RecordSpec) では読まず、ルートの子要素をすべて値の木 (properties) にする

/** 組織の設定 1 ファイル */
export type SettingsJson = JsonType<'settings'> & {
    /** ファイル名から接尾辞を除いたもの (Case・Security など) */
    fullName: string;
    /** ルートの子要素 (要素名 → 値の木)。同じ名前の要素が 2 つ以上あれば配列 */
    properties?: ValueTreeProperties;
};

/** 読み込んだ XML を JSON にする。ルート要素は <名前>Settings */
export const makeSettingsJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): SettingsJson | null => {
    const root = readXmlRoot(file, `${file.name}Settings`, 'settings', problems);
    if (!root) return null;
    const properties = toValueTreeProperties(root);
    return makeMetadataJson<SettingsJson>(
        'settings',
        {
            fullName: file.name,
            ...(Object.keys(properties).length ? { properties } : {}),
        },
        root,
        file,
        registry,
    );
};
