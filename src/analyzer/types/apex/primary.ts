import typia from 'typia';

import {
    Convert,
    convertExcludeError,
    ConvertExcludeError,
    ConvertType,
    convertValue,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
} from './commons';

import {
    BasePrimaryType,
    ErrorType,
    IdPrimaryType,
    LiteralPrimaryType,
    PrimaryType,
    SuperPrimaryType,
    ThisPrimaryType,
    TypeRefPrimaryType,
    VoidPrimaryType,
} from './converter';
import { makeTypeJson, TypeJson } from './type';
import { SoqlJson, makeSoqlJson } from './query/soql';
import { SoslJson, makeSoslJson } from './query/sosl';

const makeStringPrimary = (
    target: ConvertExcludeError<
        PrimaryType | SuperPrimaryType | ThisPrimaryType | VoidPrimaryType | IdPrimaryType
    >,
): string => {
    return typeof target.value === 'string' ? target.value : target.value.value;
};

type LiteralPrimaryJson = {
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

const makeLiteralPrimary = (
    target: ConvertExcludeError<LiteralPrimaryType>,
): LiteralPrimaryJson => {
    return {
        value: target.value.value,
        valueType: target.value.valueType,
    };
};

export type PrimaryJson = string | LiteralPrimaryJson | TypeJson | SoqlJson | SoslJson;

export const isPrimaryJson = typia.createIs<PrimaryJson>();

export const makePrimaryJson = (
    target: ConvertExcludeError<BasePrimaryType>,
): PrimaryJson | ErrorJson => {
    if (
        target.type === 'primary' ||
        target.type === 'superPrimary' ||
        target.type === 'thisPrimary' ||
        target.type === 'voidPrimary' ||
        target.type === 'idPrimary'
    ) {
        return makeStringPrimary(target);
    } else if (target.type === 'literalPrimary') {
        return makeLiteralPrimary(target);
    } else if (target.type === 'typeRefPrimary') {
        return makeTypeJson(target.value);
    } else if (target.type === 'soqlPrimary') {
        return makeSoqlJson(target.value.value);
    } else {
        return makeSoslJson(target.value);
    }
};
