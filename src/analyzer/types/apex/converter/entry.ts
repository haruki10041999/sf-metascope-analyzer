import {
    EntryTypeClass,
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    isSelectEntryType,
    isSubFieldEntryType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
} from './commons';

export const makeSelectEntryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SelectEntryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectEntryType),
        construct: (_typeClass: SelectEntryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSubFieldEntryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubFieldEntryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldEntryType),
        construct: (_typeClass: SubFieldEntryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
