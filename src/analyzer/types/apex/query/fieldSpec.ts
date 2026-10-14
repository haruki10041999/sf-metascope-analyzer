import { FieldSpecClass, isSoqlFunctionClass, isStringArray, SoslFieldClass } from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { LogicalField, makeLogicalField } from './common';
import { OrderByField, makeOrderByField } from './orderBy';
import { LimitField, makeLimitField } from './limit';
import { OffsetField, makeOffsetField } from './offset';

export type FieldSpecField = {
    object: string;
    field?: (string[] | SoqlFunctionField)[];
    where?: LogicalField;
    listView?: string;
    orderBy?: OrderByField[];
    limit?: LimitField;
    offset?: OffsetField;
};

const makeSoslField = (soslField: SoslFieldClass): string[] | SoqlFunctionField | undefined => {
    const value = soslField.getValue();
    const func = soslField.getFunc();

    if (value) {
        let field: string[] | SoqlFunctionField | undefined = undefined;
        if (isStringArray(value)) {
            field = value;
        }

        if (isSoqlFunctionClass(value)) {
            const soqlFunctionField = makeSoqlFunctionField(value);
            if (soqlFunctionField) {
                field = soqlFunctionField;
            }
        }

        if (field) {
            if (func) {
                field = {
                    funcName: func,
                    arg: field,
                };
            }

            return field;
        }
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
                const fields: (string[] | SoqlFunctionField)[] = [];
                fieldList.forEach((field) => {
                    const soslField = makeSoslField(field);
                    if (soslField) {
                        fields.push(soslField);
                    }
                });
                fieldSpecField.field = fields;
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
