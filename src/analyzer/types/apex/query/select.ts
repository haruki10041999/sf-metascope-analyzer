import { JsonType } from '../../commons';
import type {
    FieldNameTypeClass,
    SelectEntryTypeClass,
    SelectListTypeClass,
    SubFieldEntryTypeClass,
    SubFieldListTypeClass,
} from '../../apex_IR';

import { makeNodeJson } from '../commons/node';
import { SoqlFunctionBody, makeSoqlFunctionBody } from './soqlFunction';
import { TypeOfBody, makeTypeOfBody } from './typeof';
import { SubQueryJson, makeSubQueryJson } from './subQuery';

/** 項目の名前の中身 (SELECT・ORDER BY の項目のノードに展開するときはこちら) */
export type FieldBody = {
    type: 'field';
    field: string[];
};

/** 項目の名前 (条件の左辺・GROUP BY などに単独で置くもの) */
export type FieldJson = JsonType<'soqlField'> & FieldBody;

export const makeFieldBody = (target: FieldNameTypeClass): FieldBody => ({
    type: 'field',
    field: target.getFields().value.map((v) => v.getFields().value.getFields().value),
});

export const makeFieldJson = (target: FieldNameTypeClass): FieldJson =>
    makeNodeJson<FieldJson>('soqlField', target, makeFieldBody(target));

export type SelectEntryJson = (
    (JsonType<'selectEntry'> & (FieldBody | SoqlFunctionBody | TypeOfBody)) | SubQueryJson
) & {
    alias?: string;
};

type SelectEntryBodyJson = JsonType<'selectEntry'> & (FieldBody | SoqlFunctionBody | TypeOfBody);

const makeSelectEntryJson = (
    target: SelectEntryTypeClass | SubFieldEntryTypeClass,
): SelectEntryJson => {
    const fields = target.getFields();
    const value = fields.value;
    let result: SelectEntryJson;
    switch (value.kind) {
        case 'fieldName':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeFieldBody(value),
            });
            break;
        case 'soqlFunction':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeSoqlFunctionBody(value),
            });
            break;
        case 'subQuery':
            // サブクエリは、サブクエリ自身のキーを持つ
            result = { ...makeSubQueryJson(value) };
            break;
        case 'typeOf':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeTypeOfBody(value),
            });
            break;
    }

    // 別名は typeOf 以外だけが持つ
    if ('alias' in fields && fields.alias) {
        result.alias = fields.alias.getFields().value.getFields().value;
    }
    return result;
};

/** SELECT の項目の並び (サブクエリの項目の並びも同じ) */
export type SelectJson = JsonType<'soqlSelect'> & {
    field: SelectEntryJson[];
};

export const makeSelectJson = (target: SelectListTypeClass | SubFieldListTypeClass): SelectJson => {
    const entries: readonly (SelectEntryTypeClass | SubFieldEntryTypeClass)[] =
        target.getFields().value;
    return makeNodeJson<SelectJson>('soqlSelect', target, {
        field: entries.map((v) => makeSelectEntryJson(v)),
    });
};
