import {
    EntryClass,
    isStringArray,
    isSoqlFunctionClass,
    isTypeOfClass,
    isSubQueryClass,
} from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { TypeOfField, makeTypeOfField } from './typeof';
import { SubQueryField, makeSubQueryField } from './subQuery';

export type SelectField = {
    field?: { field: string[]; alias?: string }[];
    soqlFunction?: { field: SoqlFunctionField; alias?: string }[];
    typeOf?: { field: TypeOfField; alias?: string }[];
    subQuery?: { field: SubQueryField; alias?: string }[];
};

export const makeSelectField = (entries: EntryClass[]): SelectField | undefined => {
    const select: SelectField = {};

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
        }

        if (isSoqlFunctionClass(value)) {
            if (!select.soqlFunction) {
                select.soqlFunction = [];
            }

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
        }

        if (isTypeOfClass(value)) {
            if (!select.typeOf) {
                select.typeOf = [];
            }

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
        }

        if (isSubQueryClass(value)) {
            if (!select.subQuery) {
                select.subQuery = [];
            }

            const subQuery = makeSubQueryField(value);
            if (subQuery) {
                const field: { field: SubQueryField; alias?: string } = { field: subQuery };
                if (alias) {
                    field.alias = alias;
                }
                select.subQuery.push(field);
            }
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

    if (select.subQuery && select.subQuery.length > 0) {
        select.subQuery.sort((a, b) => a.field.from.field.localeCompare(b.field.from.field));
    }

    if (Object.keys(select).length > 0) {
        return select;
    }

    return undefined;
};
