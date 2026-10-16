import {
    EntryClass,
    isStringArray,
    isSoqlFunctionClass,
    isTypeOfClass,
    isSubQueryClass,
} from '../converter';

import { SoqlFunctionSet, assignSoqlFunction, sortSoqlFunctionSet } from './soqlFunction';
import { TypeOfField, makeTypeOfField } from './typeof';
import { SubQueryField, makeSubQueryField } from './subQuery';

export type SelectField = {
    field?: { field: string[]; alias?: string }[];
    soqlFunction?: SoqlFunctionSet;
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
                select.soqlFunction = {};
            }

            assignSoqlFunction(value, select.soqlFunction, alias ?? undefined);
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
        select.field.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            const fieldLengthDiff = a.field.length - b.field.length;
            if (fieldLengthDiff !== 0) return fieldLengthDiff;

            for (let i = 0; i < a.field.length; i++) {
                const diff = a.field[i]!.localeCompare(b.field[i]!);
                if (diff !== 0) return diff;
            }

            return 0;
        });
    }

    if (select.soqlFunction) {
        sortSoqlFunctionSet(select.soqlFunction);
    }

    if (select.typeOf && select.typeOf.length > 0) {
        select.typeOf.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            const fieldLengthDiff = a.field.field.length - b.field.field.length;
            if (fieldLengthDiff !== 0) return fieldLengthDiff;

            for (let i = 0; i < a.field.field.length; i++) {
                const diff = a.field.field[i]!.localeCompare(b.field.field[i]!);
                if (diff !== 0) return diff;
            }

            const blockLengthDiff = a.field.conditionBlock.length - b.field.conditionBlock.length;
            if (blockLengthDiff !== 0) return blockLengthDiff;

            return 0;
        });
    }

    if (select.subQuery && select.subQuery.length > 0) {
        select.subQuery.sort((a, b) => {
            const aliasDiff = Number(a.alias !== undefined) - Number(b.alias !== undefined);
            if (aliasDiff !== 0) return aliasDiff;

            const fromAliasDiff =
                Number(a.field.from.alias !== undefined) - Number(b.field.from.alias !== undefined);
            if (fromAliasDiff !== 0) return fromAliasDiff;

            const fromFieldDiff = a.field.from.field.localeCompare(b.field.from.field);
            if (fromFieldDiff !== 0) return fromFieldDiff;

            if (a.field.select.field && b.field.select.field) {
                const selectFieldLengthDiff =
                    a.field.select.field.length - b.field.select.field.length;
                if (selectFieldLengthDiff !== 0) return selectFieldLengthDiff;
            }

            if (a.field.select.soqlFunction && b.field.select.soqlFunction) {
                const keysLengthDiff =
                    Object.keys(a.field.select.soqlFunction).length -
                    Object.keys(b.field.select.soqlFunction).length;
                if (keysLengthDiff !== 0) return keysLengthDiff;
            }

            return 0;
        });
    }

    if (Object.keys(select).length > 0) {
        return select;
    }

    return undefined;
};

