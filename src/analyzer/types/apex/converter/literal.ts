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
    value: string;
    valueType: 'integer' | 'long' | 'number' | 'string' | 'longText' | 'boolean' | 'null';
};

export const isLiteralType = (value: unknown): value is LiteralType => {
    return isCommonType(value) && value.type === 'literal';
};

export const makeLiteralAssignRule: AssignForValueRule<NormalLiteralTypeClass, LiteralType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
    construct: (literalTypeClass: NormalLiteralTypeClass) => {
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value: literalTypeClass.getValue(),
            valueType: literalTypeClass.getValueType(),
        };
    },
};

export type SignedIntegerType = CommonType<'signedInteger'> & {
    value: string;
    valueType: 'integer';
    operator: '+' | '-' | null;
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
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value: literalTypeClass.getValue(),
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
};

export type SignedNumberType = CommonType<'signedNumber'> & {
    value: string;
    valueType: 'number' | 'integer';
    operator: '+' | '-' | null;
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
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value: literalTypeClass.getValue(),
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
    value: string;
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
        const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
            makeSoslClausesAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: literalTypeClass.getType(),
            sourceInfo: makeSourceInfo(literalTypeClass),
            value: literalTypeClass.getValue(),
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
          value: QualifiedNameType;
          valueType: 'id';
      }
    | {
          value: ErrorType;
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

            if (typeof value === 'string') {
                const valueType = literalTypeClass.getValueType() as
                    'integer' | 'long' | 'string' | 'longText' | 'null';

                if (valueType === 'integer' || valueType === 'long') {
                    const operator = literalTypeClass.getOperator();
                    return {
                        type: literalTypeClass.getType(),
                        sourceInfo: makeSourceInfo(literalTypeClass),
                        value,
                        valueType,
                        operator,
                    };
                } else {
                    return {
                        type: literalTypeClass.getType(),
                        sourceInfo: makeSourceInfo(literalTypeClass),
                        value,
                        valueType,
                    };
                }
            } else if (value.type === 'qualifiedName') {
                const valueType = literalTypeClass.getValueType() as 'id';
                return {
                    type: literalTypeClass.getType(),
                    sourceInfo: makeSourceInfo(literalTypeClass),
                    value,
                    valueType,
                };
            } else {
                return {
                    type: literalTypeClass.getType(),
                    sourceInfo: makeSourceInfo(literalTypeClass),
                    value: value,
                };
            }
        },
    };
