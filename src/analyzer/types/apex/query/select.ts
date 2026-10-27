import typia from 'typia';

import {
    Convert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    ConvertType,
    convertValue,
    StructureJsonType,
    makeStructureJsonType,
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

export type FieldJson = JsonType<'field'> & {
    field: string[];
};

export const isFieldJson = typia.createIs<FieldJson>();

export const makeFieldJson = (
    target: ConvertType<FieldNameType>,
    targetRecords?: Record<string, string[]>,
): FieldJson | ErrorJson => {
    return convertValue<'fieldName', 'field', FieldNameType, FieldJson>(
        ['fieldName'],
        target,
        ['field'],
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
        'field' | 'soqlFunction' | 'subQuery' | 'typeOf',
        SelectEntryType | SubFieldEntryType,
        SelectEntryJson
    >(
        ['selectEntry', 'subFieldEntry'],
        target,
        ['field', 'soqlFunction', 'subQuery', 'typeOf'],
        'selectEntry',
        (target, targetRecords, _) => {
            let value: SelectEntryJson | ErrorJson;
            if (target.value.type === 'fieldName') {
                value = makeFieldJson(target.value, targetRecords);
            } else if (target.value.type === 'soqlFunction') {
                value = makeSoqlFunctionJson(target.value, targetRecords);
            } else if (target.value.type === 'subQuery') {
                value = makeSubQueryJson(target.value, targetRecords);
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

export type SelectJson = StructureJsonType<
    'selectClause',
    {
        field?: Omit<FieldJson, 'sourceKeys'>[];
        soqlFunction?: Omit<SoqlFunctionJson, 'sourceKeys'>[];
        typeOf?: Omit<TypeOfJson, 'sourceKeys'>[];
        subQuery?: Omit<SubQueryJson, 'sourceKeys'>[];
        error?: Omit<ErrorJson, 'sourceKeys'>[];
    }
>;

export const isSelectJson = typia.createIs<SelectJson>();

export const makeSelectJson = (
    target: ConvertType<SelectListType | SubFieldListType>,
): SelectJson | ErrorJson => {
    return convertValue<
        'selectList' | 'subFieldList',
        'selectClause',
        SelectListType | SubFieldListType,
        SelectJson
    >(
        ['selectList', 'subFieldList'],
        target,
        ['selectClause'],
        'selectClause',
        (target, _targetRecords, _errorJson) => {
            const fields: FieldJson[] = [];
            const soqlFunctions: SoqlFunctionJson[] = [];
            const subQueries: SubQueryJson[] = [];
            const typeOfs: TypeOfJson[] = [];
            const errors: ErrorJson[] = [];

            target.value.forEach((v) => {
                const selectJson = makeSelectEntryJson(v);

                if (isErrorJson(selectJson)) {
                    errors.push(selectJson);
                } else if (selectJson.kind === 'field') {
                    fields.push(selectJson);
                } else if (selectJson.kind === 'soqlFunction') {
                    soqlFunctions.push(selectJson);
                } else if (selectJson.kind === 'subQuery') {
                    subQueries.push(selectJson);
                } else {
                    typeOfs.push(selectJson);
                }
            });

            const properties = {
                ...(fields.length > 0 ? { field: fields } : {}),
                ...(soqlFunctions.length > 0 ? { soqlFunction: soqlFunctions } : {}),
                ...(subQueries.length > 0 ? { subQuery: subQueries } : {}),
                ...(typeOfs.length > 0 ? { typeOf: typeOfs } : {}),
                ...(errors.length > 0 ? { error: errors } : {}),
            };

            return makeStructureJsonType('selectClause', properties) as SelectJson;
        },
    );
};
