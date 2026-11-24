import { JsonType } from '../../commons';

import type {
    ElseClauseTypeClass,
    FieldNameListTypeClass,
    FieldNameTypeClass,
    TypeOfTypeClass,
    WhenClauseTypeClass,
} from '../../apex_IR';

import { makeNodeJson } from '../commons/node';

/** TYPEOF の WHEN / ELSE の節 1 つ (ELSE は object が 'else') */
export type TypeOfBlockJson = JsonType<'typeOfWhen'> & {
    object: string[] | 'else';
    field: string[][];
};

const makeFieldNameJson = (target: FieldNameTypeClass): string[] =>
    target.getFields().value.map((v) => v.getFields().value.getFields().value);

const makeFieldNameListJson = (target: FieldNameListTypeClass): string[][] =>
    target.getFields().value.map((v) => makeFieldNameJson(v));

const makeWhenJson = (target: WhenClauseTypeClass): TypeOfBlockJson => {
    const { value, field } = target.getFields();
    return makeNodeJson<TypeOfBlockJson>('typeOfWhen', target, {
        object: makeFieldNameJson(value),
        field: makeFieldNameListJson(field),
    });
};

const makeElseJson = (target: ElseClauseTypeClass): TypeOfBlockJson => {
    return makeNodeJson<TypeOfBlockJson>('typeOfWhen', target, {
        object: 'else',
        field: makeFieldNameListJson(target.getFields().value),
    });
};

/** TYPEOF の中身。TYPEOF は SELECT の項目にしか置けないので、項目のノード (selectEntry) に展開する */
export type TypeOfBody = {
    type: 'typeOf';
    field: string[];
    block: TypeOfBlockJson[];
};

export const makeTypeOfBody = (target: TypeOfTypeClass): TypeOfBody => {
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
