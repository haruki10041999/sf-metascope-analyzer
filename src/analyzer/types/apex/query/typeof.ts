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
export const isWhenJson = typia.createIs<TypeOfBlockJson>();

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

export type TypeOfJson = JsonType<'typeOf'> & {
    field: string[];
    block: TypeOfBlockJson[];
};
export const isTypeOfJson = typia.createIs<TypeOfJson>();

export const makeTypeOfJson = (
    target: ConvertType<TypeOfType>,
    targetRecords?: Record<string, string[]>,
): TypeOfJson | ErrorJson => {
    return convertValue<'typeOf', TypeOfType, TypeOfJson>(
        ['typeOf'],
        target,
        'typeOf',
        (target, targetRecords) => {
            const typeOfBlocks: TypeOfBlockJson[] = [];
            target.whenClause.forEach((v) => {
                typeOfBlocks.push(makeWhenJson(v));
            });
            if (target.elseClause) {
                typeOfBlocks.push(makeElseJson(target.elseClause));
            }

            return makeJsonType('typeOf', targetRecords, {
                field: target.value.value.map((v) => v.value.value),
                block: typeOfBlocks,
            });
        },
        targetRecords,
    );
};
