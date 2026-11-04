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
} from '../commons/xmlJson';
import { XmlElement, childrenOf } from '../commons/xml';

export const LIST_VIEW_SCHEMA = {
    label: 'string',
    filterScope: 'string',
    booleanFilter: 'string',
    language: 'string',
} as const;

/** リストビューの検索条件。booleanFilter の番号は filters の並び順 (1 始まり) を指す */
export type ListViewFilterJson = { field: string; operation: string; value?: string };

/** リストビュー (listViews/*.listView-meta.xml) */
export type ListViewJson = JsonType<'listView'> & {
    fullName: string;
    columns?: string[];
    filters?: ListViewFilterJson[];
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
            ...readProperties(element, LIST_VIEW_SCHEMA),
            ...nonEmptyEntry('columns', readTexts(element, 'columns')),
            ...nonEmptyEntry(
                'filters',
                childrenOf(element, 'filters').map((filter) => {
                    const value = readText(filter, 'value');
                    return {
                        field: readText(filter, 'field') ?? '',
                        operation: readText(filter, 'operation') ?? '',
                        ...(value !== undefined ? { value } : {}),
                    };
                }),
            ),
        },
        element,
        file,
        registry,
    );
