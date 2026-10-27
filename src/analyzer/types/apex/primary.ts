import typia from 'typia';

import {
    Convert,
    convertExcludeError,
    ConvertExcludeError,
    ConvertType,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    StructureJsonType,
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

const makeStringPrimary = (
    target: ConvertExcludeError<
        PrimaryType | SuperPrimaryType | ThisPrimaryType | VoidPrimaryType | IdPrimaryType
    >,
): string => {
    if (target.type === 'idPrimary') {
        return target.value.value;
    }

    return target.value;
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

const makeTypeRefPrimary = (
    target: ConvertExcludeError<TypeRefPrimaryType>,
    targetRecords?: Record<string, string[]>,
): TypeJson | ErrorJson => {
    return makeTypeJson(target.value, targetRecords);
};

export type PrimaryJson = string | LiteralPrimaryJson | TypeJson;

export const isPrimaryJson = typia.createIs<PrimaryJson>();

export const makePrimaryJson = (
    target: Convert<BasePrimaryType | ErrorType>,
    targetRecords: Record<string, string[]>,
): PrimaryJson | ErrorJson => {
    if (target.type === 'error') {
        return makeJsonType('error', targetRecords, { kindType: 'primary' });
    }

    const { value, errorInfos } = convertExcludeError<BasePrimaryType>(
        target as Convert<BasePrimaryType>,
    );
    if (!value || errorInfos.length > 0) {
        return makeJsonType('error', targetRecords, { kindType: 'primary' });
    }

    if (
        value.type === 'primary' ||
        value.type === 'superPrimary' ||
        value.type === 'thisPrimary' ||
        value.type === 'voidPrimary' ||
        value.type === 'idPrimary'
    ) {
        return makeStringPrimary(value, targetRecords);
    }

    if (value.type === 'literalPrimary') {
        return makeLiteralPrimary(value, targetRecords);
    }

    if (value.type === 'typeRefPrimary') {
        return makeTypeRefPrimary(value, targetRecords);
    }

    return makeJsonType('error', targetRecords, { kindType: 'primary' });
};
