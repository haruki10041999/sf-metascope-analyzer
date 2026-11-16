import { JsonType } from '../commons';
import type { BasedPrimaryTypeClass, LiteralTypeClass } from '../apex_IR';

import { makeNodeJson } from './commons/node';
import { makeTypeJson, TypeJson } from './type';
import { SoqlJson, makeSoqlJson } from './query/soql';
import { SoslJson, makeSoslJson } from './query/sosl';

// Apex の式のうち、いちばん内側のもの (識別子・this・super・リテラル・Type.class・SOQL・SOSL)。
// docs/apex-json-review.md 2.2 (段階 A2)。どれも kind と sourceKeys を持つ

/** 名前 (変数・型・項目など、文脈で決まる) */
export type IdentifierJson = JsonType<'identifier'> & { name: string };

export type ThisJson = JsonType<'this'>;
export type SuperJson = JsonType<'super'>;

/** 文字列のリテラル。値は引用符を除き、エスケープを戻したもの (複数行の文字列も string) */
export type StringLiteralJson = JsonType<'string'> & { value: string };
/** 数のリテラル。精度を失わないよう、ソースの文字列のまま持つ (Long の L は除かない) */
export type IntegerLiteralJson = JsonType<'integer'> & { value: string };
export type LongLiteralJson = JsonType<'long'> & { value: string };
export type DecimalLiteralJson = JsonType<'decimal'> & { value: string };
export type BooleanLiteralJson = JsonType<'boolean'> & { value: boolean };
export type NullLiteralJson = JsonType<'null'>;

export type LiteralJson =
    | StringLiteralJson
    | IntegerLiteralJson
    | LongLiteralJson
    | DecimalLiteralJson
    | BooleanLiteralJson
    | NullLiteralJson;

/** Type.class / void.class */
export type ClassLiteralJson = JsonType<'classLiteral'> & { classType: TypeJson | 'void' };

/** 読めなかった式 (ANTLR の回復でしかできない)。nodeType は parser の規則の名前 */
export type UnsupportedJson = JsonType<'unsupported'> & { nodeType: string };

const ESCAPES: Readonly<Record<string, string>> = {
    n: '\n',
    t: '\t',
    r: '\r',
    b: '\b',
    f: '\f',
};

/** 'abc' / '''abc''' の中身 (エスケープを戻す) */
export const unquoteApexString = (text: string): string => {
    const body = text.startsWith("'''")
        ? text.slice(3, -3)
        : text.startsWith("'")
          ? text.slice(1, -1)
          : text;
    return body.replace(/\\(.)/gs, (_, c: string) => ESCAPES[c] ?? c);
};

/** リテラル 1 つ (式のリテラル・アノテーションの引数) */
export const makeLiteralNodeJson = (literal: LiteralTypeClass): LiteralJson => {
    const { value, valueType } = literal.getFields();
    switch (valueType) {
        case 'string':
        case 'longText':
            return makeNodeJson<StringLiteralJson>('string', literal, {
                value: unquoteApexString(value),
            });
        case 'integer':
            return makeNodeJson<IntegerLiteralJson>('integer', literal, { value });
        case 'long':
            return makeNodeJson<LongLiteralJson>('long', literal, { value });
        case 'number':
            return makeNodeJson<DecimalLiteralJson>('decimal', literal, { value });
        case 'boolean':
            return makeNodeJson<BooleanLiteralJson>('boolean', literal, {
                value: value.toLowerCase() === 'true',
            });
        case 'null':
            return makeNodeJson<NullLiteralJson>('null', literal);
    }
};

export type PrimaryJson =
    | IdentifierJson
    | ThisJson
    | SuperJson
    | LiteralJson
    | ClassLiteralJson
    | UnsupportedJson
    | SoqlJson
    | SoslJson;

export const makePrimaryJson = (target: BasedPrimaryTypeClass): PrimaryJson => {
    switch (target.kind) {
        case 'primary':
            // ANTLR の回復でしかできない
            return makeNodeJson<UnsupportedJson>('unsupported', target, { nodeType: 'primary' });
        case 'superPrimary':
            return makeNodeJson<SuperJson>('super', target);
        case 'thisPrimary':
            return makeNodeJson<ThisJson>('this', target);
        case 'voidPrimary':
            return makeNodeJson<ClassLiteralJson>('classLiteral', target, { classType: 'void' });
        case 'idPrimary':
            return makeNodeJson<IdentifierJson>('identifier', target, {
                name: target.getFields().value.getFields().value,
            });
        case 'literalPrimary':
            return makeLiteralNodeJson(target.getFields().value);
        case 'typeRefPrimary':
            return makeNodeJson<ClassLiteralJson>('classLiteral', target, {
                classType: makeTypeJson(target.getFields().value),
            });
        case 'soqlPrimary':
            return makeSoqlJson(target.getFields().value.getFields().value);
        case 'soslPrimary':
            return makeSoslJson(target.getFields().value);
    }
};
