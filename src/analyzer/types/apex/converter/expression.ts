import {
    ArrayExpressionTypeClass,
    Arth1ExpressionTypeClass,
    Arth2ExpressionTypeClass,
    AssignExpressionTypeClass,
    BitAndExpressionTypeClass,
    BitExpressionTypeClass,
    BitNotExpressionTypeClass,
    BitOrExpressionTypeClass,
    BoundExpressionTypeClass,
    CastExpressionTypeClass,
    CmpExpressionTypeClass,
    CoalExpressionTypeClass,
    CondExpressionTypeClass,
    ConditionalExpressionTypeClass,
    ConditionExpressionTypeClass,
    DotExpressionTypeClass,
    DoubleOperatorExpressionTypeClass,
    EqualityExpressionTypeClass,
    ExpressionListBaseTypeClass,
    ExpressionTypeClass,
    FieldExpressionTypeClass,
    FilteringExpressionTypeClass,
    InstanceOfExpressionTypeClass,
    LogAndExpressionTypeClass,
    LogicalExpressionTypeClass,
    LogOrExpressionTypeClass,
    MethodCallExpressionTypeClass,
    NegExpressionTypeClass,
    NewExpressionTypeClass,
    NormalExpressionTypeClass,
    ParExpressionTypeClass,
    PostOpExpressionTypeClass,
    PreOpExpressionTypeClass,
    PrimaryExpressionTypeClass,
    SingleOperatorExpressionTypeClass,
    SubExpressionTypeClass,
    WhereConditionalExpressionTypeClass,
    WhereFieldExpressionTypeClass,
    WhereLogicalExpressionTypeClass,
    isArrayExpressionType,
    isArth1ExpressionType,
    isArth2ExpressionType,
    isAssignExpressionType,
    isBitAndExpressionType,
    isBitExpressionType,
    isBitNotExpressionType,
    isBitOrExpressionType,
    isBoundExpressionType,
    isCastExpressionType,
    isCmpExpressionType,
    isCoalExpressionType,
    isCondExpressionType,
    isConditionalExpressionType,
    isDotExpressionType,
    isEqualityExpressionType,
    isFieldExpressionType,
    isFilteringExpressionType,
    isInstanceOfExpressionType,
    isLogAndExpressionType,
    isLogicalExpressionType,
    isLogOrExpressionType,
    isMethodCallExpressionType,
    isNegExpressionType,
    isNewExpressionType,
    isNormalExpressionType,
    isParExpressionType,
    isPostOpExpressionType,
    isPreOpExpressionType,
    isPrimaryExpressionType,
    isSubExpressionType,
    isWhereConditionalExpressionType,
    isWhereFieldExpressionType,
    isWhereLogicalExpressionType,
    isBasedPrimaryType,
    BasedPrimaryTypeClass,
    BasedExpressionTypeClass,
} from '../../apex_IR';
import {
    DotMethodCallType,
    makeDotMethodCallRule,
    makeMethodCallRule,
    MethodCallType,
} from './call';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeEmptySourceInfoMap,
} from './commons';
import { makeAnyIdRule } from './id';
import { makeBasePrimaryRule } from './primary';

export const makeArrayExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayExpressionType),
        construct: (_typeClass: ArrayExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeArth1ExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<Arth1ExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth1ExpressionType),
        construct: (_typeClass: Arth1ExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeArth2ExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<Arth2ExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArth2ExpressionType),
        construct: (_typeClass: Arth2ExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeAssignExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AssignExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAssignExpressionType),
        construct: (_typeClass: AssignExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeBitAndExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitAndExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitAndExpressionType),
        construct: (_typeClass: BitAndExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeBitExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitExpressionType),
        construct: (_typeClass: BitExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeBitNotExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitNotExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitNotExpressionType),
        construct: (_typeClass: BitNotExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeBitOrExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BitOrExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBitOrExpressionType),
        construct: (_typeClass: BitOrExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeBoundExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<BoundExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isBoundExpressionType),
        construct: (_typeClass: BoundExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeCastExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CastExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCastExpressionType),
        construct: (_typeClass: CastExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeCmpExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CmpExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCmpExpressionType),
        construct: (_typeClass: CmpExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeCoalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CoalExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoalExpressionType),
        construct: (_typeClass: CoalExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeCondExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CondExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCondExpressionType),
        construct: (_typeClass: CondExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeConditionalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ConditionalExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isConditionalExpressionType),
        construct: (_typeClass: ConditionalExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export type DotExpressionType = {
    object: ValueRuleValue<unknown>;
    operator: ValueRuleValue<string>;
    member: ValueRuleValue<string | DotMethodCallType>;
};

export const makeDotExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DotExpressionTypeClass, DotExpressionType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDotExpressionType),
        construct: (expressiontypeClass: DotExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const object = assignMultiClass(expressiontypeClass, [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const operator = assignMultiClass(expressiontypeClass.getOperator(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            const member = assignMultiClass(expressiontypeClass.getRight(), [
                makeAnyIdRule(nestedSourceInfo),
                makeDotMethodCallRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[expressiontypeClass.getType()] = nestedSourceInfo;
            return { object, operator, member };
        },
    };
};

export const makeEqualityExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<EqualityExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isEqualityExpressionType),
        construct: (_typeClass: EqualityExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldExpressionType),
        construct: (_typeClass: FieldExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFilteringExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FilteringExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringExpressionType),
        construct: (_typeClass: FilteringExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeInstanceOfExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<InstanceOfExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isInstanceOfExpressionType),
        construct: (_typeClass: InstanceOfExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeLogAndExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogAndExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogAndExpressionType),
        construct: (_typeClass: LogAndExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeLogicalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogicalExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogicalExpressionType),
        construct: (_typeClass: LogicalExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeLogOrExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LogOrExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLogOrExpressionType),
        construct: (_typeClass: LogOrExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeMethodCallExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MethodCallExpressionTypeClass, ValueRuleValue<MethodCallType>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMethodCallExpressionType),
        construct: (expressiontypeClass: MethodCallExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const methodCall = assignMultiClass(expressiontypeClass, [
                makeMethodCallRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[expressiontypeClass.getType()] = nestedSourceInfo;
            return methodCall;
        },
    };
};

export const makeNegExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NegExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNegExpressionType),
        construct: (_typeClass: NegExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeNewExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NewExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNewExpressionType),
        construct: (_typeClass: NewExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeNormalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalExpressionTypeClass, ValueRuleValue<string>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalExpressionType),
        construct: (expressionTypeClass: NormalExpressionTypeClass) => {
            return assignMultiClass(expressionTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        sourceInfo[expressionTypeClass.getType()] =
                            makeSourceInfo(expressionTypeClass);
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        },
    };
};

export const makeParExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ParExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isParExpressionType),
        construct: (_typeClass: ParExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makePostOpExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PostOpExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPostOpExpressionType),
        construct: (_typeClass: PostOpExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makePreOpExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PreOpExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPreOpExpressionType),
        construct: (_typeClass: PreOpExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makePrimaryExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<PrimaryExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isPrimaryExpressionType),
        construct: (expressionTypeClass: PrimaryExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const primaryExpression = assignMultiClass(expressionTypeClass.getValue(), [
                {
                    isValid: (target: unknown) => isTargetTypeClass(target, isBasedPrimaryType),
                    construct: (typeClass: BasedPrimaryTypeClass) => {
                        const primary = assignMultiClass(typeClass, [
                            ...makeBasePrimaryRule(nestedSourceInfo, errorInfo),
                            makeErrorAssignRule(errorInfo),
                        ]);
                        sourceInfo[expressionTypeClass.getType()] = nestedSourceInfo;
                        return primary;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            return primaryExpression;
        },
    };
};

export const makeSubExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubExpressionType),
        construct: (_typeClass: SubExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhereConditionalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereConditionalExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereConditionalExpressionType),
        construct: (_typeClass: WhereConditionalExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhereFieldExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereFieldExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereFieldExpressionType),
        construct: (_typeClass: WhereFieldExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhereLogicalExpressionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereLogicalExpressionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereLogicalExpressionType),
        construct: (_typeClass: WhereLogicalExpressionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export type BaseExpressionRuleValueType = ValueRuleValue<unknown>;

export const makeBaseExpressionRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return [
        makeNormalExpressionRule(sourceInfo, errorInfo),
        makePrimaryExpressionRule(sourceInfo, errorInfo),
        makeDotExpressionRule(sourceInfo, errorInfo),
        makeMethodCallExpressionRule(sourceInfo, errorInfo),
        makeNewExpressionRule(sourceInfo, errorInfo),
        makeCastExpressionRule(sourceInfo, errorInfo),
        makeSubExpressionRule(sourceInfo, errorInfo),
        makeArrayExpressionRule(sourceInfo, errorInfo),
        makeArth1ExpressionRule(sourceInfo, errorInfo),
        makeArth2ExpressionRule(sourceInfo, errorInfo),
        makeAssignExpressionRule(sourceInfo, errorInfo),
        makeBitAndExpressionRule(sourceInfo, errorInfo),
        makeBitExpressionRule(sourceInfo, errorInfo),
        makeBitOrExpressionRule(sourceInfo, errorInfo),
        makeBitNotExpressionRule(sourceInfo, errorInfo),
        makeCmpExpressionRule(sourceInfo, errorInfo),
        makeCoalExpressionRule(sourceInfo, errorInfo),
        makeCondExpressionRule(sourceInfo, errorInfo),
        makeEqualityExpressionRule(sourceInfo, errorInfo),
        makeInstanceOfExpressionRule(sourceInfo, errorInfo),
        makeLogAndExpressionRule(sourceInfo, errorInfo),
        makeLogOrExpressionRule(sourceInfo, errorInfo),
        makeNegExpressionRule(sourceInfo, errorInfo),
        makePostOpExpressionRule(sourceInfo, errorInfo),
        makePreOpExpressionRule(sourceInfo, errorInfo),
    ];
};
