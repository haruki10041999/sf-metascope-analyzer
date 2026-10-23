import {
    ArgumentsTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isNormalArgumentsType,
    isTypeArgumentsType as isTypeArgumentsTypeClass,
} from '../../apex_IR';

import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import {
    makeExpressionListAssignRule,
    makeTypeListAssignRule,
    ExpressionListType,
    TypeListType,
} from './list';

export type ArgumentsType = CommonType<'arguments'> & {
    value: ValueRuleValue<ExpressionListType | null>;
};

export const isArgumentsType = (value: unknown): value is ArgumentsType => {
    return isCommonType(value) && value.type === 'arguments';
};

export const makeArgumentsAssignRule: AssignForValueRule<NormalArgumentsTypeClass, ArgumentsType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalArgumentsType),
        construct: (argumentsTypeClass: NormalArgumentsTypeClass) => {
            const value = assignMultiClass(argumentsTypeClass.getValue(), [
                makeExpressionListAssignRule,
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);

            return {
                type: argumentsTypeClass.getType(),
                sourceInfo: makeSourceInfo(argumentsTypeClass),
                value,
            };
        },
    };

export type TypeArgumentsType = CommonType<'typeArguments'> & {
    value: ValueRuleValue<TypeListType | null>;
};

export const isTypeArgumentsType = (value: unknown): value is TypeArgumentsType => {
    return isCommonType(value) && value.type === 'typeArguments';
};

export const makeTypeArgumentsAssignRule: AssignForValueRule<
    TypeArgumentsTypeClass,
    TypeArgumentsType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeArgumentsTypeClass),
    construct: (argumentsTypeClass: TypeArgumentsTypeClass) => {
        const value = assignMultiClass(argumentsTypeClass.getValue(), [
            makeTypeListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: argumentsTypeClass.getType(),
            sourceInfo: makeSourceInfo(argumentsTypeClass),
            value,
        };
    },
};
