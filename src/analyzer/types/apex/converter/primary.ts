import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { IdType } from './id';
import { LiteralType, SoqlLiteralType, SoslLiteralType } from './literal';
import { TypeRefType } from './type';

export type IdPrimaryType = CommonType<'idPrimary'> & {
    value: ValueRuleValue<IdType>;
};

export const isIdPrimaryType = (value: unknown): value is IdPrimaryType => {
    return isCommonType(value) && value.type === 'idPrimary';
};

export type LiteralPrimaryType = CommonType<'literalPrimary'> & {
    value: ValueRuleValue<LiteralType>;
};

export const isLiteralPrimaryType = (value: unknown): value is LiteralPrimaryType => {
    return isCommonType(value) && value.type === 'literalPrimary';
};

export type PrimaryType = CommonType<'primary'> & {
    value: string;
};

export const isPrimaryType = (value: unknown): value is PrimaryType => {
    return isCommonType(value) && value.type === 'primary';
};

export type SoqlPrimaryType = CommonType<'soqlPrimary'> & {
    value: ValueRuleValue<SoqlLiteralType>;
};

export const isSoqlPrimaryType = (value: unknown): value is SoqlPrimaryType => {
    return isCommonType(value) && value.type === 'soqlPrimary';
};

export type SoslPrimaryType = CommonType<'soslPrimary'> & {
    value: ValueRuleValue<SoslLiteralType>;
};

export const isSoslPrimaryType = (value: unknown): value is SoslPrimaryType => {
    return isCommonType(value) && value.type === 'soslPrimary';
};

export type SuperPrimaryType = CommonType<'superPrimary'> & {
    value: string;
};

export const isSuperPrimaryType = (value: unknown): value is SuperPrimaryType => {
    return isCommonType(value) && value.type === 'superPrimary';
};

export type ThisPrimaryType = CommonType<'thisPrimary'> & {
    value: string;
};

export const isThisPrimaryType = (value: unknown): value is ThisPrimaryType => {
    return isCommonType(value) && value.type === 'thisPrimary';
};

export type TypeRefPrimaryType = CommonType<'typeRefPrimary'> & {
    value: ValueRuleValue<TypeRefType>;
};

export const isTypeRefPrimaryType = (value: unknown): value is TypeRefPrimaryType => {
    return isCommonType(value) && value.type === 'typeRefPrimary';
};

export type VoidPrimaryType = CommonType<'voidPrimary'> & {
    value: string;
};

export const isVoidPrimaryType = (value: unknown): value is VoidPrimaryType => {
    return isCommonType(value) && value.type === 'voidPrimary';
};

export type BasePrimaryType =
    | IdPrimaryType
    | LiteralPrimaryType
    | SoqlPrimaryType
    | SoslPrimaryType
    | TypeRefPrimaryType
    | VoidPrimaryType
    | SuperPrimaryType
    | ThisPrimaryType
    | PrimaryType;

export const isBasePrimaryType = (value: unknown): value is BasePrimaryType => {
    return (
        isCommonType(value) &&
        [
            'idPrimary',
            'literalPrimary',
            'soqlPrimary',
            'soslPrimary',
            'typeRefPrimary',
            'voidPrimary',
            'superPrimary',
            'thisPrimary',
            'primary',
        ].includes(value.type)
    );
};
