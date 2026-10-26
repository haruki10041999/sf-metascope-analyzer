import typia from 'typia';

import {
    Convert,
    convertExcludeError,
    ConvertExcludeError,
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

type StringPrimaryJson = JsonType<'primary'> & {
    primaryType: 'primary' | 'voidPrimary' | 'superPrimary' | 'thisPrimary' | 'idPrimary';
    value: string;
};

const makeStringPrimary = (
    target: ConvertExcludeError<
        PrimaryType | SuperPrimaryType | ThisPrimaryType | VoidPrimaryType | IdPrimaryType
    >,
    targetRecords: Record<string, string[]>,
): StringPrimaryJson => {
    if (target.type === 'idPrimary') {
        return makeJsonType('primary', targetRecords, {
            primaryType: target.type,
            value: target.value.value,
        });
    }

    return makeJsonType('primary', targetRecords, {
        primaryType: target.type,
        value: target.value,
    });
};

type LiteralPrimaryJson = JsonType<'primary'> & {
    primaryType: 'literalPrimary';
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

const makeLiteralPrimary = (
    target: ConvertExcludeError<LiteralPrimaryType>,
    targetRecords: Record<string, string[]>,
): LiteralPrimaryJson => {
    return makeJsonType('primary', targetRecords, {
        primaryType: target.type,
        value: target.value.value,
        valueType: target.value.valueType,
    });
};

type TypeRefPrimaryJson = JsonType<'primary'> & {
    primaryType: 'typeRefPrimary';
} & Omit<TypeJson, 'kind' | 'sourceKeys'>;

const makeTypeRefPrimary = (
    target: ConvertExcludeError<TypeRefPrimaryType>,
    targetRecords: Record<string, string[]>,
): TypeRefPrimaryJson | ErrorJson => {
    const typeJson: TypeJson | ErrorJson = makeTypeJson(target.value, targetRecords);

    if (typeJson.kind === 'error') {
        return makeJsonType('error', targetRecords, {
            kindType: 'primary',
        });
    } else {
        const { kind, sourceKeys, ...content } = typeJson;
        return makeJsonType('primary', targetRecords, {
            primaryType: target.type,
            ...content,
        });
    }
};

export type PrimaryJson = StringPrimaryJson | LiteralPrimaryJson | TypeRefPrimaryJson;

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
