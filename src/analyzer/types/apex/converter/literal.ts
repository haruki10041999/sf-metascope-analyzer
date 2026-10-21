import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import { makeBoundExpressionRule, BoundExpressionType } from './expression';
import { makeQueryRule, QueryType } from './query';
import { makeSoslClausesRule, SoslClausesType } from './clause';
import { makeQualifiedNameRule, QualifiedNameType } from './name';

export type LiteralType = CommonType & {
    value: ValueRuleValue<string>;
    valueType: string;
};

export const isLiteralType = typia.createIs<LiteralType>();

export const makeLiteralRule = (): AssignForValueRule<NormalLiteralTypeClass, LiteralType> => ({
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
});

export type SignedIntegerType = CommonType & {
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedIntegerType = typia.createIs<SignedIntegerType>();

export const makeSignedIntegerRule = (): AssignForValueRule<
    SignedIntegerTypeClass,
    SignedIntegerType
> => ({
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
});

export type SignedNumberType = CommonType & {
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedNumberType = typia.createIs<SignedNumberType>();

export const makeSignedNumberRule = (): AssignForValueRule<
    SignedNumberTypeClass,
    SignedNumberType
> => ({
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
});

export type SoqlLiteralType = CommonType & {
    value: ValueRuleValue<QueryType>;
};

export const isSoqlLiteralType = typia.createIs<SoqlLiteralType>();

export const makeSoqlLiteralRule = (): AssignForValueRule<
    SoqlLiteralTypeClass,
    SoqlLiteralType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlLiteralTypeClass),
        construct: (literalTypeClass: SoqlLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeQueryRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: literalTypeClass.getType(),
                sourceInfo: makeSourceInfo(literalTypeClass),
                value,
            };
        },
    };
};

export type SoslLiteralAltType = CommonType & {
    value: ValueRuleValue<string>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralAltType = typia.createIs<SoslLiteralAltType>();

export const makeSoslLiteralAltRule = (): AssignForValueRule<
    SoslLiteralAltTypeClass,
    SoslLiteralAltType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralAltTypeClass),
        construct: (literalTypeClass: SoslLiteralAltTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule,
            ]);
            const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
                makeSoslClausesRule(),
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
};

export type SoslLiteralType = CommonType & {
    value: ValueRuleValue<string | BoundExpressionType>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralType = typia.createIs<SoslLiteralType>();

export const makeSoslLiteralRule = (): AssignForValueRule<
    SoslLiteralTypeClass,
    SoslLiteralType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralTypeClass),
        construct: (literalTypeClass: SoslLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeStringAssignRule,
                makeBoundExpressionRule(),
                makeErrorAssignRule,
            ]);
            const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
                makeSoslClausesRule(),
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
};

export type WhenLiteralType = CommonType & {
    value: ValueRuleValue<string | QualifiedNameType>;
    valueType: string;
    operator: string | null;
};

export const isWhenLiteralType = typia.createIs<WhenLiteralType>();

export const makeWhenLiteralRule = (): AssignForValueRule<
    WhenLiteralTypeClass,
    WhenLiteralType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenLiteralTypeClass),
        construct: (literalTypeClass: WhenLiteralTypeClass) => {
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeStringAssignRule,
                makeQualifiedNameRule(),
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
};
