import { FieldSpecClass, isSoqlFunctionClass, isStringArray, SoslFieldClass } from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { LogicalField, makeLogicalField } from './common';
import { OrderByField, makeOrderByField } from './orderBy';
import { LimitField, makeLimitField } from './limit';
import { OffsetField, makeOffsetField } from './offset';

type SoslField = {
    field?: string[][];
    soqlFunction?: SoqlFunctionField[];
};

export type FieldSpecField = {
    object: string;
    field?: SoslField;
    where?: LogicalField;
    listView?: string;
    orderBy?: OrderByField[];
    limit?: LimitField;
    offset?: OffsetField;
};

const makeSoslField = (soslField: SoslFieldClass[]): SoslField | undefined => {
    const fieldList: SoslField = {};

    soslField.forEach((f) => {
        const value = f.getValue();
        const func = f.getFunc();

        if (value) {
            let field: string[] | SoqlFunctionField | undefined = undefined;
            if (isStringArray(value) && value.length > 0) {
                field = value;
            }

            if (isSoqlFunctionClass(value)) {
                const soqlFunctionField = makeSoqlFunctionField(value);
                if (soqlFunctionField) {
                    field = soqlFunctionField;
                }
            }

            if (field) {
                if (func === 'FORMAT') {
                    field = {
                        funcName: func,
                        arg: field,
                    };
                } else if (func === 'TOLABEL' || func === 'CONVERT_CURRENCY') {
                    if (!Array.isArray(field)) return;

                    field = {
                        funcName: func,
                        arg: field,
                    };
                }

                if (Array.isArray(field)) {
                    if (!fieldList.field) {
                        fieldList.field = [];
                    }
                    fieldList.field.push(field);
                } else if (field !== undefined) {
                    if (!fieldList.soqlFunction) {
                        fieldList.soqlFunction = [];
                    }

                    fieldList.soqlFunction.push(field);
                }
            }
        }
    });

    if (fieldList.field && fieldList.field.length > 0) {
        fieldList.field.sort((a, b) => a.length - b.length || a.at(0)!.localeCompare(b.at(0)!));
    }

    if (fieldList.soqlFunction && fieldList.soqlFunction.length > 0) {
        fieldList.soqlFunction.sort((a, b) => a.funcName.localeCompare(b.funcName));
    }

    if (Object.keys(fieldList).length > 0) {
        return fieldList;
    }

    return undefined;
};

export const makeFieldSpecField = (fieldSpec: FieldSpecClass[]): FieldSpecField[] | undefined => {
    const fieldSpecFields: FieldSpecField[] = [];

    fieldSpec.forEach((field) => {
        const value = field.getValue();
        const fieldList = field.getFieldList();
        const where = field.getWhere();
        const listview = field.getListView();
        const orderBy = field.getOrderBy();
        const limit = field.getLimitClause();
        const offset = field.getOffsetClause();

        if (value.length === 1) {
            const object = value.at(0)!;

            const fieldSpecField: FieldSpecField = {
                object: object,
            };

            if (fieldList.length > 0) {
                const fields = makeSoslField(fieldList);
                if (fields) {
                    fieldSpecField.field = fields;
                }
            }

            const whereField = makeLogicalField(where);
            if (whereField) {
                fieldSpecField.where = whereField;
            }

            if (listview.length === 1) {
                fieldSpecField.listView = listview.at(0)!;
            }

            const orderByField = makeOrderByField(orderBy);
            if (orderByField) {
                fieldSpecField.orderBy = orderByField;
            }

            if (limit) {
                const limitField = makeLimitField(limit);
                if (limitField) {
                    fieldSpecField.limit = limitField;
                }
            }

            if (offset) {
                const offsetField = makeOffsetField(offset);
                if (offsetField) {
                    fieldSpecField.offset = offsetField;
                }
            }

            fieldSpecFields.push(fieldSpecField);
        }
    });

    if (fieldSpecFields.length > 0) {
        return fieldSpecFields;
    }

    return undefined;
};

