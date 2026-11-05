import typia from 'typia';

import { ConvertType, ConvertWithError, isErrorNode } from './commons';
import { ConvertKeys, ErrorJson, makeErrorJson } from '../commons';

import {
    BasePrimaryType,
    IdPrimaryType,
    LiteralPrimaryType,
    PrimaryType,
    SuperPrimaryType,
    ThisPrimaryType,
    VoidPrimaryType,
} from './converter';
import { makeTypeJson, TypeJson } from './type';
import { SoqlJson, makeSoqlJson } from './query/soql';
import { SoslJson, makeSoslJson } from './query/sosl';

const ERROR_KIND = 'primary';

const makeStringPrimary = (
    target: ConvertWithError<
        PrimaryType | SuperPrimaryType | ThisPrimaryType | VoidPrimaryType | IdPrimaryType
    >,
): string | ErrorJson => {
    if (typeof target.value === 'string') {
        return target.value;
    }
    if (isErrorNode(target.value)) {
        return makeErrorJson(target.value, ERROR_KIND);
    }
    return target.value.value;
};

/** リテラル。kind を持たない値だが、findings (ハードコードされた ID など) の位置のために sourceKeys を持つ */
export type LiteralPrimaryJson = {
    sourceKeys: ConvertKeys;
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

const makeLiteralPrimary = (
    target: ConvertWithError<LiteralPrimaryType>,
): LiteralPrimaryJson | ErrorJson => {
    if (isErrorNode(target.value)) {
        return makeErrorJson(target.value, ERROR_KIND);
    }
    return {
        sourceKeys: { objectKey: target.value.objectKey, sourceKey: target.value.sourceKey },
        value: target.value.value,
        valueType: target.value.valueType,
    };
};

export type PrimaryJson = string | LiteralPrimaryJson | TypeJson | SoqlJson | SoslJson;

export const isPrimaryJson = typia.createIs<PrimaryJson>();

export const makePrimaryJson = (target: ConvertType<BasePrimaryType>): PrimaryJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, ERROR_KIND);
    }

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
        if (isErrorNode(target.value)) {
            return makeErrorJson(target.value, ERROR_KIND);
        }
        return makeSoqlJson(target.value.value);
    } else {
        return makeSoslJson(target.value);
    }
};
