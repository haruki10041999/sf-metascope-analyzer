import typia from 'typia';

import {
    Convert,
    isConvert,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
} from '../commons';

import { TypeOfType, FieldNameType, WhenClauseType, ElseClauseType } from '../converter';

export type WhenJson = {
    object: string[];
    field: string[][];
};
export const isWhenJson = typia.createIs<WhenJson>();

const makeWhenJson = (target: Convert<WhenClauseType>): WhenJson => {
    const fieldName = castConvert(castExcludeErrorInfo(target.value));
    const object = castConvertArray(castExcludeErrorInfoArray(fieldName.value)).map((v) => {
        return castConvert(castExcludeErrorInfo(v.value)).value;
    });

    const fieldNameList = castConvert(castExcludeErrorInfo(target.field));
    const field = castConvertArray(castExcludeErrorInfoArray(fieldNameList.value)).map((v) => {
        const ids = castConvertArray(castExcludeErrorInfoArray(v.value));
        return ids.map((id) => castConvert(castExcludeErrorInfo(id.value)).value);
    });

    return {
        object: object,
        field: field,
    };
};

const makeElseJson = (target: Convert<ElseClauseType>): string[][] => {
    const fieldNameList = castConvert(castExcludeErrorInfo(target.value));
    return castConvertArray(castExcludeErrorInfoArray(fieldNameList.value)).map((v) => {
        const ids = castConvertArray(castExcludeErrorInfoArray(v.value));
        return ids.map((id) => castConvert(castExcludeErrorInfo(id.value)).value);
    });
};

export type TypeOfJson = {
    type: 'typeOf';
    field: string[];
    when: WhenJson[];
    elseField?: string[][];
};
export const isTypeOfJson = typia.createIs<TypeOfJson>();

export const makeTypeOfJson = (target: Convert<TypeOfType>): TypeOfJson => {
    const fieldName = castConvert(castExcludeErrorInfo(target.value));
    const field = castConvertArray(castExcludeErrorInfoArray(fieldName.value)).map((v) => {
        return castConvert(castExcludeErrorInfo(v.value)).value;
    });

    const when = castConvertArray(castExcludeErrorInfoArray(target.whenClause)).map((v) =>
        makeWhenJson(v),
    );

    const typeofJson: TypeOfJson = {
        type: 'typeOf',
        field: field,
        when: when,
    };

    const elseClause = castExcludeErrorInfo(target.elseClause);
    const elseField = elseClause ? makeElseJson(castConvert(elseClause)) : undefined;
    if (elseField) {
        typeofJson.elseField = elseField;
    }

    return typeofJson;
};
