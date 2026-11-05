import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BoundExpressionType } from './expression';
import { QueryType } from './query';
import { SoslClausesType } from './clause';
import { QualifiedNameType } from './name';

export type LiteralType = CommonType<'literal'> & {
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

export const isLiteralType = (value: unknown): value is LiteralType => {
    return isCommonType(value) && value.type === 'literal';
};

export type SignedIntegerType = CommonType<'signedInteger'> & {
    value: string;
    valueType: 'integer';
    operator: '+' | '-' | null;
};

export const isSignedIntegerType = (value: unknown): value is SignedIntegerType => {
    return isCommonType(value) && value.type === 'signedInteger';
};

export type SignedNumberType = CommonType<'signedNumber'> & {
    value: string;
    valueType: 'number' | 'integer';
    operator: '+' | '-' | null;
};

export const isSignedNumberType = (value: unknown): value is SignedNumberType => {
    return isCommonType(value) && value.type === 'signedNumber';
};

export type SoqlLiteralType = CommonType<'soqlLiteral'> & {
    value: ValueRuleValue<QueryType>;
};

export const isSoqlLiteralType = (value: unknown): value is SoqlLiteralType => {
    return isCommonType(value) && value.type === 'soqlLiteral';
};

// FindLiteral（[FIND '...'）/ FindLiteralAlt（[FIND {...}）のトークンから検索語だけを取り出す。
// 形式が想定外のときはトークンの文字列をそのまま返す
const FIND_LITERAL_PATTERN = /^\[\s*FIND\s*(?:'((?:\\.|[^\\'])*)'|\{((?:\\.|[^\\}])*)\})\s*$/i;

export const extractFindSearchTerm = (token: string): string => {
    const match = token.match(FIND_LITERAL_PATTERN);
    return match ? (match[1] ?? match[2] ?? token) : token;
};

export type SoslLiteralAltType = CommonType<'soslLiteralAlt'> & {
    value: string;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralAltType = (value: unknown): value is SoslLiteralAltType => {
    return isCommonType(value) && value.type === 'soslLiteralAlt';
};

export type SoslLiteralType = CommonType<'soslLiteral'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralType = (value: unknown): value is SoslLiteralType => {
    return isCommonType(value) && value.type === 'soslLiteral';
};

export type WhenLiteralType =
    | (CommonType<'whenLiteral'> & {
          value: string;
          valueType: 'string' | 'longText' | 'null';
      })
    | {
          value: string;
          valueType: 'integer' | 'long';
          operator: string | null;
      }
    | {
          value: ValueRuleValue<QualifiedNameType>;
          valueType: 'id';
      };

export const isWhenLiteralType = (value: unknown): value is WhenLiteralType => {
    return isCommonType(value) && value.type === 'whenLiteral';
};
