import {
    NormalLiteralTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralAltTypeClass,
    SoslLiteralTypeClass,
    WhenLiteralTypeClass,
    isNormalLiteralType,
    isSignedIntegerType as isSignedIntegerTypeClass,
    isSignedNumberType as isSignedNumberTypeClass,
    isSoqlLiteralType as isSoqlLiteralTypeClass,
    isSoslLiteralAltType as isSoslLiteralAltTypeClass,
    isSoslLiteralType as isSoslLiteralTypeClass,
    isWhenLiteralType as isWhenLiteralTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import { makeBoundExpressionAssignRule, BoundExpressionType } from './expression';
import { makeQueryAssignRule, QueryType } from './query';
import { makeSoslClausesAssignRule, SoslClausesType } from './clause';
import { makeQualifiedNameAssignRule, QualifiedNameType } from './name';

export type LiteralType = CommonType<'literal'> & {
    value: ValueRuleValue<string>;
    valueType: string;
};

export const isLiteralType = (value: unknown): value is LiteralType => {
    return isCommonType(value) && value.type === 'literal';
};

export const makeLiteralAssignRule: AssignForValueRule<NormalLiteralTypeClass, LiteralType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
    construct: (literalTypeClass: NormalLiteralTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value,
            valueType: literalTypeClass.getValueType(),
        };
    },
};

export type SignedIntegerType = CommonType<'signedInteger'> & {
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedIntegerType = (value: unknown): value is SignedIntegerType => {
    return isCommonType(value) && value.type === 'signedInteger';
};

export const makeSignedIntegerAssignRule: AssignForValueRule<
    SignedIntegerTypeClass,
    SignedIntegerType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedIntegerTypeClass),
    construct: (literalTypeClass: SignedIntegerTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value,
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
};

export type SignedNumberType = CommonType<'signedNumber'> & {
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedNumberType = (value: unknown): value is SignedNumberType => {
    return isCommonType(value) && value.type === 'signedNumber';
};

export const makeSignedNumberAssignRule: AssignForValueRule<
    SignedNumberTypeClass,
    SignedNumberType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedNumberTypeClass),
    construct: (literalTypeClass: SignedNumberTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value,
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
};

export type SoqlLiteralType = CommonType<'soqlLiteral'> & {
    value: ValueRuleValue<QueryType>;
};

export const isSoqlLiteralType = (value: unknown): value is SoqlLiteralType => {
    return isCommonType(value) && value.type === 'soqlLiteral';
};

export const makeSoqlLiteralAssignRule: AssignForValueRule<SoqlLiteralTypeClass, SoqlLiteralType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlLiteralTypeClass),
        construct: (literalTypeClass: SoqlLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeQueryAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: literalTypeClass.getType(),
                sourceInfo: makeSourceInfo(literalTypeClass),
                value,
            };
        },
    };

export type SoslLiteralAltType = CommonType<'soslLiteralAlt'> & {
    value: ValueRuleValue<string>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralAltType = (value: unknown): value is SoslLiteralAltType => {
    return isCommonType(value) && value.type === 'soslLiteralAlt';
};

export const makeSoslLiteralAltAssignRule: AssignForValueRule<
    SoslLiteralAltTypeClass,
    SoslLiteralAltType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralAltTypeClass),
    construct: (literalTypeClass: SoslLiteralAltTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule,
        ]);
        const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
            makeSoslClausesAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value,
            soslClauses,
        };
    },
};

export type SoslLiteralType = CommonType<'soslLiteral'> & {
    value: ValueRuleValue<string | BoundExpressionType>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralType = (value: unknown): value is SoslLiteralType => {
    return isCommonType(value) && value.type === 'soslLiteral';
};

export const makeSoslLiteralAssignRule: AssignForValueRule<SoslLiteralTypeClass, SoslLiteralType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralTypeClass),
        construct: (literalTypeClass: SoslLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeStringAssignRule,
                makeBoundExpressionAssignRule,
                makeErrorAssignRule,
            ]);
            const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
                makeSoslClausesAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: literalTypeClass.getType(),
                sourceInfo: makeSourceInfo(literalTypeClass),
                value,
                soslClauses,
            };
        },
    };

export type WhenLiteralType = CommonType<'whenLiteral'> & {
    value: ValueRuleValue<string | QualifiedNameType>;
    valueType: string;
    operator: string | null;
};

export const isWhenLiteralType = (value: unknown): value is WhenLiteralType => {
    return isCommonType(value) && value.type === 'whenLiteral';
};

export const makeWhenLiteralAssignRule: AssignForValueRule<WhenLiteralTypeClass, WhenLiteralType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenLiteralTypeClass),
        construct: (literalTypeClass: WhenLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeStringAssignRule,
                makeQualifiedNameAssignRule,
                makeErrorAssignRule,
            ]);

            const valueType = literalTypeClass.getValueType();
            const operator = literalTypeClass.getOperator();

            return {
                type: literalTypeClass.getType(),
                sourceInfo: makeSourceInfo(literalTypeClass),
                value,
                valueType,
                operator,
            };
        },
    };
