import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    ConvertExcludeError,
    ConvertType,
    convertValue,
} from '../commons';

import { TypeOfType, FieldNameType, WhenClauseType, ElseClauseType } from '../converter';

export type TypeOfBlockJson =
    | {
          object: string[];
          field: string[][];
      }
    | {
          object: 'else';
          field: string[][];
      };
export const isTypeOfBlockJson = typia.createIs<TypeOfBlockJson>();

const makeWhenJson = (target: ConvertExcludeError<WhenClauseType>): TypeOfBlockJson => {
    const object = target.value.value.map((v) => v.value.value);
    const field = target.field.value.map((v) => v.value.map((v) => v.value.value));

    return {
        object: object,
        field: field,
    };
};

const makeElseJson = (target: ConvertExcludeError<ElseClauseType>): TypeOfBlockJson => {
    const value = target.value.value.map((v) => v.value.map((v) => v.value.value));
    return {
        object: 'else',
        field: value,
    };
};

export type TypeOfJson = {
    type: 'typeOf';
    field: string[];
    block: TypeOfBlockJson[];
};
export const isTypeOfJson = typia.createIs<TypeOfJson>();

export const makeTypeOfJson = (target: ConvertExcludeError<TypeOfType>): TypeOfJson => {
    return {
        type: 'typeOf',
        field: target.value.value.map((v) => v.value.value),
        block: [
            ...target.whenClause.map((v) => makeWhenJson(v)),
            ...(target.elseClause ? [makeElseJson(target.elseClause)] : []),
        ],
    };
};

