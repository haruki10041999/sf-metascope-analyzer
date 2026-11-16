import { JsonType } from '../commons/json';

import {
    XmlFile,
    XmlSourceRegistry,
    PropertiesOf,
    makeXmlJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readTexts,
    unknownChildNames,
} from '../commons/xmlJson';
import { XmlElement } from '../commons/xml';
import { type CriterionJson, type CriterionNames, readCriteria } from './criteria';

export const LIST_VIEW_SCHEMA = {
    label: 'string',
    filterScope: 'string',
    booleanFilter: 'filterLogic',
    language: 'string',
} as const;

/** リストビューの検索条件の要素名。booleanFilter の番号は filters の並び順 (1 始まり) を指す */
const LIST_VIEW_FILTER_NAMES: CriterionNames = {
    left: 'field',
    operator: 'operation',
    value: 'value',
};

/** リストビュー (listViews/*.listView-meta.xml) */
export type ListViewJson = JsonType<'listView'> & {
    /** 読んでいない要素の名前 */
    skippedElements?: string[];
    fullName: string;
    columns?: string[];
    /** 検索条件 (書いた順。段階 M5 で criterion にした) */
    filters?: CriterionJson[];
} & PropertiesOf<typeof LIST_VIEW_SCHEMA>;

export const makeListViewJson = (
    element: XmlElement,
    fullName: string,
    file: XmlFile,
    registry: XmlSourceRegistry,
): ListViewJson =>
    makeXmlJson<ListViewJson>(
        'listView',
        {
            fullName: readText(element, 'fullName') ?? fullName,
            ...readProperties(element, LIST_VIEW_SCHEMA, { file, registry }),
            ...nonEmptyEntry('columns', readTexts(element, 'columns')),
            ...nonEmptyEntry(
                'filters',
                readCriteria(element, 'filters', LIST_VIEW_FILTER_NAMES, { file, registry }),
            ),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(element, [
                    'fullName',
                    ...Object.keys(LIST_VIEW_SCHEMA),
                    'columns',
                    'filters',
                ]),
            ),
        },
        element,
        file,
        registry,
    );
