import {
    SelectEntry,
    SoqlFunction,
    DateFieldName,
    SignedLiteral,
    Expression,
    SubQuery,
    TypeOf,
    SubFieldEntry,
} from '../converter';

import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';
import { TypeOfField, makeTypeOfField } from './typeof';

type SubQueryField = {
    kind: 'subQuery';
};

type Field = {
    kind: 'field';
    name: string[];
};

type SelectField =
    | {
          field: Field | SoqlFunctionField | SubQueryField | TypeOfField;
          alias?: string;
      }
    | 'unSupported';

const isField = (entry: any): entry is string[] => {
    return Array.isArray(entry) && entry.every((e) => typeof e === 'string');
};

const isSoqlFunction = (entry: any): entry is SoqlFunction => {
    return;
};

export const makeSelectListType = (
    selectentries: SelectEntry[] | SubFieldEntry[],
): SelectField[] => {
    const selectFields: SelectField[] = [];

    return selectFields;
};
