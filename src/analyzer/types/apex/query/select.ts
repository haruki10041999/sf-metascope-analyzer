import typia from 'typia';

import {
    Convert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    ConvertType,
    convertValue,
    ConvertExcludeError,
    isSpecificJsonType,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import {
    SelectListType,
    SelectEntryType,
    FieldNameType,
    SubFieldListType,
    SubFieldEntryType,
} from '../converter';

import { SoqlFunctionJson, makeSoqlFunctionJson } from './soqlFunction';
import { TypeOfJson, makeTypeOfJson } from './typeof';
import { SubQueryJson, makeSubQueryJson } from './subQuery';

export type FieldJson = {
    type: 'field';
    field: string[];
};

export const isFieldJson = typia.createIs<FieldJson>();

export const makeFieldJson = (target: ConvertExcludeError<FieldNameType>): FieldJson => {
    return {
        type: 'field',
        field: target.value.map((v) => v.value.value),
    };
};

export type SelectEntryJson = (
    (JsonType<'selectEntry'> & (FieldJson | SoqlFunctionJson | TypeOfJson)) | SubQueryJson
) & {
    alias?: string;
};
export const isSelectEntryJson = typia.createIs<SelectEntryJson>();

const makeSelectEntryJson = (
    target: ConvertType<SelectEntryType | SubFieldEntryType>,
): SelectEntryJson | ErrorJson => {
    return convertValue<
        'selectEntry' | 'subFieldEntry',
        SelectEntryType | SubFieldEntryType,
        SelectEntryJson | ErrorJson
    >(target, 'selectEntry', (target, targetRecords) => {
        let value: SelectEntryJson | ErrorJson;
        if (target.value.type === 'fieldName') {
            value = makeJsonType('selectEntry', targetRecords.base, {
                ...makeFieldJson(target.value),
            });
        } else if (target.value.type === 'soqlFunction') {
            value = makeJsonType('selectEntry', targetRecords.base, {
                ...makeSoqlFunctionJson(target.value),
            });
        } else if (target.value.type === 'subQuery') {
            value = makeSubQueryJson(target.value);
        } else {
            value = makeJsonType('selectEntry', targetRecords.base, {
                ...makeTypeOfJson(target.value),
            });
        }

        if (isErrorJson(value)) {
            return value;
        }

        const result: SelectEntryJson = { ...value };
        if (target.alias) {
            result.alias = target.alias.value.value;
        }
        return result;
    });
};

export type SelectJson = {
    field: (SelectEntryJson | ErrorJson)[];
};

export const isSelectJson = typia.createIs<SelectJson>();

export const makeSelectJson = (
    target: ConvertType<SelectListType | SubFieldListType>,
): SelectJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'select');
    }

    return {
        field: target.value.map((v) => makeSelectEntryJson(v)),
    };
};
