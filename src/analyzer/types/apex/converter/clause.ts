import {
    AllRowsClauseTypeClass,
    CatchClauseTypeClass,
    ClauseListTypeClass,
    ClauseTypeClass,
    DataCategorySelectionTypeClass,
    ElseClauseTypeClass,
    FieldGroupByTypeClass,
    FieldOrderTypeClass,
    FilteringSelectorTypeClass,
    ForClausesTypeClass,
    GroupByClauseTypeClass,
    LimitClauseTypeClass,
    OffsetClauseTypeClass,
    OrderByClauseTypeClass,
    SoslClausesTypeClass,
    SoslWithClauseTypeClass,
    TypeOfTypeClass,
    UpdateTypeTypeClass,
    UsingScopeTypeClass,
    WhenClauseTypeClass,
    WhereClauseTypeClass,
    WithClauseTypeClass,
    isAllRowsClauseType,
    isCatchClauseType,
    isDataCategorySelectionType,
    isElseClauseType,
    isFieldGroupByType,
    isFieldOrderType,
    isFilteringSelectorType,
    isForClausesType,
    isGroupByClauseType,
    isLimitClauseType,
    isOffsetClauseType,
    isOrderByClauseType,
    isSoslClausesType,
    isSoslWithClauseType,
    isTypeOfType,
    isUpdateTypeType,
    isUsingScopeType,
    isWhenClauseType,
    isWhereClauseType,
    isWithClauseType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';

export const makeAllRowsClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<AllRowsClauseTypeClass, ValueRuleValue<string>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAllRowsClauseType),
        construct: (clauseTypeClass: AllRowsClauseTypeClass) => {
            const clause = assignMultiClass(clauseTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[clauseTypeClass.getType()] = makeSourceInfo(clauseTypeClass);
            return clause;
        },
    };
};

export const makeCatchClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CatchClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCatchClauseType),
        construct: (clauseTypeClass: CatchClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeDataCategorySelectionRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategorySelectionTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategorySelectionType),
        construct: (clauseTypeClass: DataCategorySelectionTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeElseClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElseClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElseClauseType),
        construct: (clauseTypeClass: ElseClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldGroupByRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldGroupByTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByType),
        construct: (clauseTypeClass: FieldGroupByTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFieldOrderRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldOrderTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderType),
        construct: (clauseTypeClass: FieldOrderTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeFilteringSelectorRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FilteringSelectorTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFilteringSelectorType),
        construct: (clauseTypeClass: FilteringSelectorTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeForClausesRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ForClausesTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isForClausesType),
        construct: (clauseTypeClass: ForClausesTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeGroupByClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<GroupByClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isGroupByClauseType),
        construct: (clauseTypeClass: GroupByClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeLimitClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LimitClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLimitClauseType),
        construct: (clauseTypeClass: LimitClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeOffsetClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<OffsetClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOffsetClauseType),
        construct: (clauseTypeClass: OffsetClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeOrderByClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<OrderByClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isOrderByClauseType),
        construct: (clauseTypeClass: OrderByClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoslClausesRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslClausesTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslClausesType),
        construct: (clauseTypeClass: SoslClausesTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoslWithClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslWithClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslWithClauseType),
        construct: (clauseTypeClass: SoslWithClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeTypeOfRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeOfTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeOfType),
        construct: (clauseTypeClass: TypeOfTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeUpdateTypeRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateTypeTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateTypeType),
        construct: (clauseTypeClass: UpdateTypeTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeUsingScopeRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UsingScopeTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUsingScopeType),
        construct: (clauseTypeClass: UsingScopeTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhenClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenClauseType),
        construct: (clauseTypeClass: WhenClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhereClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhereClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhereClauseType),
        construct: (clauseTypeClass: WhereClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWithClauseRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WithClauseTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWithClauseType),
        construct: (clauseTypeClass: WithClauseTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
