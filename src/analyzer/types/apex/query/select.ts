import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type {
    FieldNameTypeClass,
    SelectEntryTypeClass,
    SelectListTypeClass,
    SubFieldEntryTypeClass,
    SubFieldListTypeClass,
} from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';
import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { TypeOfJson, makeTypeOfJson } from './typeof';
import { SubQueryJson, makeSubQueryJson } from './subQuery';

export type FieldJson = {
    type: 'field';
    field: string[];
};

export const isFieldJson = typia.createIs<FieldJson>();

export const makeFieldJson = (target: FieldNameTypeClass): FieldJson => {
    return {
        type: 'field',
        field: target.getFields().value.map((v) => v.getFields().value.getFields().value),
    };
};

export type SelectEntryJson = (
    (JsonType<'selectEntry'> & (FieldJson | SoqlFunctionJson | TypeOfJson)) | SubQueryJson
) & {
    alias?: string;
};
export const isSelectEntryJson = typia.createIs<SelectEntryJson>();

type SelectEntryBodyJson = JsonType<'selectEntry'> & (FieldJson | SoqlFunctionJson | TypeOfJson);

const makeSelectEntryJson = (
    target: SelectEntryTypeClass | SubFieldEntryTypeClass,
): SelectEntryJson => {
    const fields = target.getFields();
    const value = fields.value;
    let result: SelectEntryJson;
    switch (value.kind) {
        case 'fieldName':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeFieldJson(value),
            });
            break;
        case 'soqlFunction':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeSoqlFunctionJson(value),
            });
            break;
        case 'subQuery':
            // サブクエリは、サブクエリ自身のキーを持つ
            result = { ...makeSubQueryJson(value) };
            break;
        case 'typeOf':
            result = makeNodeJson<SelectEntryBodyJson>('selectEntry', target, {
                ...makeTypeOfJson(value),
            });
            break;
    }

    // 別名は typeOf 以外だけが持つ
    if ('alias' in fields && fields.alias) {
        result.alias = fields.alias.getFields().value.getFields().value;
    }
    return result;
};

export type SelectJson = {
    field: (SelectEntryJson | ErrorJson)[];
};

export const isSelectJson = typia.createIs<SelectJson>();

export const makeSelectJson = (target: SelectListTypeClass | SubFieldListTypeClass): SelectJson => {
    const entries: readonly (SelectEntryTypeClass | SubFieldEntryTypeClass)[] =
        target.getFields().value;
    return {
        field: entries.map((v) => makeSelectEntryJson(v)),
    };
};
