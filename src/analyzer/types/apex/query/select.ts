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
import { SubQueryJson, isSubQueryJson, makeSubQueryJson } from './subQuery';

export type FieldJson = JsonType<'field'> & {
    field: string[];
};

export const isFieldJson = typia.createIs<FieldJson>();

export const makeFieldJson = (
    target: ConvertType<FieldNameType>,
    targetRecords?: Record<string, string[]>,
): FieldJson | ErrorJson => {
    return convertValue<'fieldName', FieldNameType, FieldJson>(
        ['fieldName'],
        target,
        'field',
        (target, targetRecords) => {
            return makeJsonType('field', targetRecords, {
                field: target.value.map((v) => v.value.value),
            });
        },
        targetRecords,
    );
};

export type SelectEntryJson = (FieldJson | SoqlFunctionJson | TypeOfJson | SubQueryJson) & {
    alias?: string;
};
export const isSelectEntryJson = typia.createIs<SelectEntryJson>();

const makeSelectEntryJson = (
    target: ConvertType<SelectEntryType | SubFieldEntryType>,
    targetRecords?: Record<string, string[]>,
): SelectEntryJson | ErrorJson => {
    return convertValue<
        'selectEntry' | 'subFieldEntry',
        SelectEntryType | SubFieldEntryType,
        SelectEntryJson | ErrorJson
    >(
        ['selectEntry', 'subFieldEntry'],
        target,
        'selectEntry',
        (target, targetRecords) => {
            let value: SelectEntryJson | ErrorJson;
            if (target.value.type === 'fieldName') {
                value = makeFieldJson(target.value, targetRecords);
            } else if (target.value.type === 'soqlFunction') {
                value = makeSoqlFunctionJson(target.value, targetRecords);
            } else if (target.value.type === 'subQuery') {
                value = makeSubQueryJson(target.value);
            } else {
                value = makeTypeOfJson(target.value, targetRecords);
            }

            if (isErrorJson(value)) {
                return value;
            }

            const result: SelectEntryJson = { ...value };
            if (target.alias) {
                result.alias = target.alias.value.value;
            }
            return result;
        },
        targetRecords,
    );
};

export type SelectJson = {
    field?: FieldJson[];
    soqlFunction?: SoqlFunctionJson[];
    typeOf?: TypeOfJson[];
    subQuery?: SubQueryJson[];
    error?: ErrorJson[];
};

export const isSelectJson = typia.createIs<SelectJson>();

export const makeSelectJson = (
    target: ConvertExcludeError<SelectListType | SubFieldListType>,
): SelectJson => {
    const fields: FieldJson[] = [];
    const soqlFunctions: SoqlFunctionJson[] = [];
    const subQueries: SubQueryJson[] = [];
    const typeOfs: TypeOfJson[] = [];
    const errors: ErrorJson[] = [];

    target.value.forEach((v) => {
        const value = makeSelectEntryJson(v);
        if (isSubQueryJson(value)) {
            subQueries.push(value);
        } else if (value.kind === 'typeOf') {
            typeOfs.push(value);
        } else if (value.kind === 'field') {
            fields.push(value);
        } else if (value.kind === 'soqlFunction') {
            soqlFunctions.push(value);
        } else {
            errors.push(value);
        }
    });

    return {
        ...(fields.length > 0 ? { field: fields } : {}),
        ...(soqlFunctions.length > 0 ? { soqlFunction: soqlFunctions } : {}),
        ...(subQueries.length > 0 ? { subQuery: subQueries } : {}),
        ...(typeOfs.length > 0 ? { typeOf: typeOfs } : {}),
        ...(errors.length > 0 ? { error: errors } : {}),
    };
};
