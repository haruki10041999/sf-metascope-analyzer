import {
    EntryClass,
    SoqlFunctionClass,
    TypeOfClass,
    SubQueryClass,
    isStringArray,
    isSoqlFunctionClass,
    isTypeOfClass,
    isSubQueryClass,
} from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { TypeOfField, makeTypeOfField } from './typeof';

type SubQueryField = SubQueryClass;

type Select = {
    field?: { field: string[]; alias?: string }[];
    soqlFunction?: { field: SoqlFunctionField; alias?: string }[];
    typeOf?: { field: TypeOfField; alias?: string }[];
    subQuery?: { field: SubQueryField; alias?: string }[];
};

export const makeSelectListType = (entries: EntryClass[]): Select => {
    const select: Select = {};

    entries.forEach((entry) => {
        const value = entry.getValue();
        const alias = entry.getAlias();

        if (isStringArray(value)) {
            if (!select.field) {
                select.field = [];
            }
            const field: { field: string[]; alias?: string } = { field: value };
            if (alias) {
                field.alias = alias;
            }

            select.field.push(field);
        } else if (isSoqlFunctionClass(value)) {
            const soqlFunctionField = makeSoqlFunctionField(value);
            if (soqlFunctionField) {
                if (!select.soqlFunction) {
                    select.soqlFunction = [];
                }

                const field: { field: SoqlFunctionField; alias?: string } = {
                    field: soqlFunctionField,
                };
                if (alias) {
                    field.alias = alias;
                }

                select.soqlFunction.push(field);
            }
        } else if (isTypeOfClass(value)) {
            const typeOfField = makeTypeOfField(value);
            if (typeOfField) {
                if (!select.typeOf) {
                    select.typeOf = [];
                }

                const field: { field: TypeOfField; alias?: string } = { field: typeOfField };
                if (alias) {
                    field.alias = alias;
                }

                select.typeOf.push(field);
            }
        } else if (isSubQueryClass(value)) {
            if (!select.subQuery) {
                select.subQuery = [];
            }
            const field: { field: SubQueryField; alias?: string } = { field: value };
            if (alias) {
                field.alias = alias;
            }
            select.subQuery.push(field);
        }
    });

    if (select.field && select.field.length > 0) {
        select.field.sort(
            (a, b) =>
                a.field.length - b.field.length || a.field.at(0)!.localeCompare(b.field.at(0)!),
        );
    }

    if (select.soqlFunction && select.soqlFunction.length > 0) {
        select.soqlFunction.sort((a, b) => a.field.funcName.localeCompare(b.field.funcName));
    }

    if (select.typeOf && select.typeOf.length > 0) {
        select.typeOf.sort(
            (a, b) =>
                a.field.field.length - b.field.field.length ||
                a.field.field.at(0)!.localeCompare(b.field.field.at(0)!),
        );
    }

    return select;
};

