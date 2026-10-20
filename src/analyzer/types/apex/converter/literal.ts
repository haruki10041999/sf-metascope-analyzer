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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
} from './commons';
import { makeBoundExpressionRule, BoundExpressionType } from './expression';
import { makeQueryRule, QueryType } from './query';
import { makeSoslClausesRule, SoslClausesType } from './clause';
import { makeQualifiedNameRule, QualifiedNameType } from './name';

export type LiteralType = {
    type: string;
    value: ValueRuleValue<string>;
    valueType: string;
};

export const isLiteralType = typia.createIs<LiteralType>();

export const makeLiteralRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalLiteralTypeClass, LiteralType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
    construct: (literalTypeClass: NormalLiteralTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(literalTypeClass));
        return {
            type: literalTypeClass.getType(),
            value,
            valueType: literalTypeClass.getValueType(),
        };
    },
});

export type SignedIntegerType = {
    type: string;
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedIntegerType = typia.createIs<SignedIntegerType>();

export const makeSignedIntegerRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SignedIntegerTypeClass, SignedIntegerType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedIntegerTypeClass),
    construct: (literalTypeClass: SignedIntegerTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(literalTypeClass));
        return {
            type: literalTypeClass.getType(),
            value,
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
});

export type SignedNumberType = {
    type: string;
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const isSignedNumberType = typia.createIs<SignedNumberType>();

export const makeSignedNumberRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SignedNumberTypeClass, SignedNumberType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedNumberTypeClass),
    construct: (literalTypeClass: SignedNumberTypeClass) => {
        const value = assignMultiClass(literalTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(literalTypeClass));
        return {
            type: literalTypeClass.getType(),
            value,
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
});

export type SoqlLiteralType = {
    type: string;
    value: ValueRuleValue<QueryType>;
};

export const isSoqlLiteralType = typia.createIs<SoqlLiteralType>();

export const makeSoqlLiteralRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlLiteralTypeClass, SoqlLiteralType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlLiteralTypeClass),
        construct: (literalTypeClass: SoqlLiteralTypeClass) => {
            const node = makeSourceNode(literalTypeClass);
            const value = assignMultiClass(literalTypeClass.getValue(), [
                makeQueryRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: literalTypeClass.getType(), value };
        },
    };
};

export type SoslLiteralAltType = {
    type: string;
    value: ValueRuleValue<string>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralAltType = typia.createIs<SoslLiteralAltType>();

export const makeSoslLiteralAltRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslLiteralAltTypeClass, SoslLiteralAltType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralAltTypeClass),
        construct: (literalTypeClass: SoslLiteralAltTypeClass) => {
            const node = makeSourceNode(literalTypeClass);
            const value = assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
                makeSoslClausesRule(sourceField(node, 'soslClauses'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return {
                type: literalTypeClass.getType(),
                value,
                soslClauses,
            };
        },
    };
};

export type SoslLiteralType = {
    type: string;
    value: ValueRuleValue<string | BoundExpressionType>;
    soslClauses: ValueRuleValue<SoslClausesType>;
};

export const isSoslLiteralType = typia.createIs<SoslLiteralType>();

export const makeSoslLiteralRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslLiteralTypeClass, SoslLiteralType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralTypeClass),
        construct: (literalTypeClass: SoslLiteralTypeClass) => {
            const node = makeSourceNode(literalTypeClass);
            const value = assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeBoundExpressionRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const soslClauses = assignMultiClass(literalTypeClass.getSoslClauses(), [
                makeSoslClausesRule(sourceField(node, 'soslClauses'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return {
                type: literalTypeClass.getType(),
                value,
                soslClauses,
            };
        },
    };
};

export type WhenLiteralType = {
    type: string;
    value: ValueRuleValue<string | QualifiedNameType>;
    valueType: string;
    operator: string | null;
};

export const isWhenLiteralType = typia.createIs<WhenLiteralType>();

export const makeWhenLiteralRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenLiteralTypeClass, WhenLiteralType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenLiteralTypeClass),
        construct: (literalTypeClass: WhenLiteralTypeClass) => {
            const node = makeSourceNode(literalTypeClass);

            const value = assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeQualifiedNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);

            const valueType = literalTypeClass.getValueType();
            const operator = literalTypeClass.getOperator();

            slot(node);
            return {
                type: literalTypeClass.getType(),
                value,
                valueType,
                operator,
            };
        },
    };
};
