import typia from 'typia';

import { ConvertKeys } from '../commons';
import type { BasedPrimaryTypeClass, LiteralPrimaryTypeClass } from '../apex_IR_v2';

import { keysOf } from './commons/node';
import { makeTypeJson, TypeJson } from './type';
import { SoqlJson, makeSoqlJson } from './query/soql';
import { SoslJson, makeSoslJson } from './query/sosl';

/** リテラル。kind を持たない値だが、findings (ハードコードされた ID など) の位置のために sourceKeys を持つ */
export type LiteralPrimaryJson = {
    sourceKeys: ConvertKeys;
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

const makeLiteralPrimary = (target: LiteralPrimaryTypeClass): LiteralPrimaryJson => {
    const literal = target.getFields().value;
    const { value, valueType } = literal.getFields();
    return { sourceKeys: keysOf(literal), value, valueType };
};

export type PrimaryJson = string | LiteralPrimaryJson | TypeJson | SoqlJson | SoslJson;

export const isPrimaryJson = typia.createIs<PrimaryJson>();

export const makePrimaryJson = (target: BasedPrimaryTypeClass): PrimaryJson => {
    switch (target.kind) {
        case 'primary':
        case 'superPrimary':
        case 'thisPrimary':
        case 'voidPrimary':
            return target.getFields().value;
        case 'idPrimary':
            return target.getFields().value.getFields().value;
        case 'literalPrimary':
            return makeLiteralPrimary(target);
        case 'typeRefPrimary':
            return makeTypeJson(target.getFields().value);
        case 'soqlPrimary':
            return makeSoqlJson(target.getFields().value.getFields().value);
        case 'soslPrimary':
            return makeSoslJson(target.getFields().value);
    }
};
