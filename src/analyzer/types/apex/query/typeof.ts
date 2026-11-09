import typia from 'typia';

import type {
    ElseClauseTypeClass,
    FieldNameListTypeClass,
    FieldNameTypeClass,
    TypeOfTypeClass,
    WhenClauseTypeClass,
} from '../../apex_IR_v2';

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

const makeFieldNameJson = (target: FieldNameTypeClass): string[] =>
    target.getFields().value.map((v) => v.getFields().value.getFields().value);

const makeFieldNameListJson = (target: FieldNameListTypeClass): string[][] =>
    target.getFields().value.map((v) => makeFieldNameJson(v));

const makeWhenJson = (target: WhenClauseTypeClass): TypeOfBlockJson => {
    const { value, field } = target.getFields();
    return {
        object: makeFieldNameJson(value),
        field: makeFieldNameListJson(field),
    };
};

const makeElseJson = (target: ElseClauseTypeClass): TypeOfBlockJson => {
    return {
        object: 'else',
        field: makeFieldNameListJson(target.getFields().value),
    };
};

export type TypeOfJson = {
    type: 'typeOf';
    field: string[];
    block: TypeOfBlockJson[];
};
export const isTypeOfJson = typia.createIs<TypeOfJson>();

export const makeTypeOfJson = (target: TypeOfTypeClass): TypeOfJson => {
    const { value, whenClause, elseClause } = target.getFields();
    return {
        type: 'typeOf',
        field: makeFieldNameJson(value),
        block: [
            ...whenClause.map((v) => makeWhenJson(v)),
            ...(elseClause ? [makeElseJson(elseClause)] : []),
        ],
    };
};
