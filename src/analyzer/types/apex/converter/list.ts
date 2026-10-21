import typia from 'typia';

import {
    ExpressionListTypeClass,
    FieldGroupByListTypeClass,
    FieldListTypeClass,
    FieldNameListTypeClass,
    FieldOrderListTypeClass,
    FieldSpecListTypeClass,
    FormalParameterListTypeClass,
    FromNameListTypeClass,
    FromNameTypeClass,
    NetworkListTypeClass,
    SelectListTypeClass,
    SoslFieldTypeClass,
    SubFieldListTypeClass,
    TypeListTypeClass,
    UpdateListTypeClass,
    ValueListTypeClass,
    isExpressionListType as isExpressionListTypeClass,
    isFieldGroupByListType as isFieldGroupByListTypeClass,
    isFieldListType as isFieldListTypeClass,
    isFieldNameListType as isFieldNameListTypeClass,
    isFieldOrderListType as isFieldOrderListTypeClass,
    isFieldSpecListType as isFieldSpecListTypeClass,
    isFormalParameterListType as isFormalParameterListTypeClass,
    isFromNameListType as isFromNameListTypeClass,
    isFromNameType as isFromNameTypeClass,
    isNetworkListType as isNetworkListTypeClass,
    isSelectListType as isSelectListTypeClass,
    isSoslFieldType as isSoslFieldTypeClass,
    isSubFieldListType as isSubFieldListTypeClass,
    isTypeListType as isTypeListTypeClass,
    isUpdateListType as isUpdateListTypeClass,
    isValueListType as isValueListTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import {
    makeFieldGroupByRule,
    makeFieldOrderRule,
    makeUpdateTypeRule,
    FieldGroupByType,
    FieldOrderType,
    UpdateTypeType,
} from './clause';
import { makeFieldNameRule, FieldNameType } from './name';
import { makeFieldSpecRule, makeSoqlFunctionRule, FieldSpecType, SoqlFunctionType } from './query';
import { makeFormalParameterRule, FormalParameterType } from './parameter';
import { makeSoqlIdRule, makeSoslIdRule, SoqlIdType, SoslIdType } from './id';
import {
    makeSelectEntryRule,
    makeSubFieldEntryRule,
    SelectEntryType,
    SubFieldEntryType,
} from './entry';
import { makeTypeRefRule, TypeRefType } from './type';
import { makeValueRule, ValueType } from './value';

export type ExpressionListType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isExpressionListType = typia.createIs<ExpressionListType>();

export const makeExpressionListRule = (): AssignForValueRule<
    ExpressionListTypeClass,
    ExpressionListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionListTypeClass),
        construct: (listTypeClass: ExpressionListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [...makeBaseExpressionRule(), makeErrorAssignRule]),
                );
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FieldGroupByListType = CommonType & {
    value: ValueRuleValue<FieldGroupByType>[];
};

export const isFieldGroupByListType = typia.createIs<FieldGroupByListType>();

export const makeFieldGroupByListRule = (): AssignForValueRule<
    FieldGroupByListTypeClass,
    FieldGroupByListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByListTypeClass),
        construct: (listTypeClass: FieldGroupByListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFieldGroupByRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FieldListType = CommonType & {
    value: ValueRuleValue<SoslFieldType>[];
};

export const isFieldListType = typia.createIs<FieldListType>();

export const makeFieldListRule = (): AssignForValueRule<FieldListTypeClass, FieldListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldListTypeClass),
        construct: (listTypeClass: FieldListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeSoslFieldRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FieldNameListType = CommonType & {
    value: ValueRuleValue<FieldNameType>[];
};

export const isFieldNameListType = typia.createIs<FieldNameListType>();

export const makeFieldNameListRule = (): AssignForValueRule<
    FieldNameListTypeClass,
    FieldNameListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameListTypeClass),
        construct: (listTypeClass: FieldNameListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFieldNameRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FieldOrderListType = CommonType & {
    value: ValueRuleValue<FieldOrderType>[];
};

export const isFieldOrderListType = typia.createIs<FieldOrderListType>();

export const makeFieldOrderListRule = (): AssignForValueRule<
    FieldOrderListTypeClass,
    FieldOrderListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderListTypeClass),
        construct: (listTypeClass: FieldOrderListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFieldOrderRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FieldSpecListType = CommonType & {
    value: ValueRuleValue<FieldSpecType>[];
};

export const isFieldSpecListType = typia.createIs<FieldSpecListType>();

export const makeFieldSpecListRule = (): AssignForValueRule<
    FieldSpecListTypeClass,
    FieldSpecListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecListTypeClass),
        construct: (listTypeClass: FieldSpecListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFieldSpecRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FormalParameterListType = CommonType & {
    value: ValueRuleValue<FormalParameterType>[];
};

export const isFormalParameterListType = typia.createIs<FormalParameterListType>();

export const makeFormalParameterListRule = (): AssignForValueRule<
    FormalParameterListTypeClass,
    FormalParameterListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterListTypeClass),
        construct: (listTypeClass: FormalParameterListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFormalParameterRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FromNameListType = CommonType & {
    value: ValueRuleValue<FromNameType>[];
};

export const isFromNameListType = typia.createIs<FromNameListType>();

export const makeFromNameListRule = (): AssignForValueRule<
    FromNameListTypeClass,
    FromNameListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameListTypeClass),
        construct: (listTypeClass: FromNameListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeFromNameRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type FromNameType = CommonType & {
    value: ValueRuleValue<FieldNameType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isFromNameType = typia.createIs<FromNameType>();

export const makeFromNameRule = (): AssignForValueRule<FromNameTypeClass, FromNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameTypeClass),
        construct: (listTypeClass: FromNameTypeClass) => {
            const value = assignMultiClass(listTypeClass.getValue(), [
                makeFieldNameRule(),
                makeErrorAssignRule,
            ]);
            const alias = assignMultiClass(listTypeClass.getAlias(), [
                makeSoqlIdRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
                alias,
            };
        },
    };
};

export type NetworkListType = CommonType & {
    value: ValueRuleValue<string>[];
};

export const isNetworkListType = typia.createIs<NetworkListType>();

export const makeNetworkListRule = (): AssignForValueRule<
    NetworkListTypeClass,
    NetworkListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNetworkListTypeClass),
        construct: (listTypeClass: NetworkListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeStringAssignRule, makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type SelectListType = CommonType & {
    value: ValueRuleValue<SelectEntryType>[];
};

export const isSelectListType = typia.createIs<SelectListType>();

export const makeSelectListRule = (): AssignForValueRule<SelectListTypeClass, SelectListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectListTypeClass),
        construct: (listTypeClass: SelectListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeSelectEntryRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type SoslFieldType = CommonType & {
    value: ValueRuleValue<SoslIdType | SoqlFunctionType>;
    func: string | null;
};

export const isSoslFieldType = typia.createIs<SoslFieldType>();

export const makeSoslFieldRule = (): AssignForValueRule<SoslFieldTypeClass, SoslFieldType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslFieldTypeClass),
        construct: (listTypeClass: SoslFieldTypeClass) => {
            const value = assignMultiClass(listTypeClass.getValue(), [
                makeSoslIdRule(),
                makeSoqlFunctionRule(),
                makeErrorAssignRule,
            ]);
            const func = listTypeClass.getFunc();
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
                func,
            };
        },
    };
};

export type SubFieldListType = CommonType & {
    value: ValueRuleValue<SubFieldEntryType>[];
};

export const isSubFieldListType = typia.createIs<SubFieldListType>();

export const makeSubFieldListRule = (): AssignForValueRule<
    SubFieldListTypeClass,
    SubFieldListType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldListTypeClass),
        construct: (listTypeClass: SubFieldListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeSubFieldEntryRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type TypeListType = CommonType & {
    value: ValueRuleValue<TypeRefType>[];
};

export const isTypeListType = typia.createIs<TypeListType>();

export const makeTypeListRule = (): AssignForValueRule<TypeListTypeClass, TypeListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeListTypeClass),
        construct: (listTypeClass: TypeListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeTypeRefRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type UpdateListType = CommonType & {
    value: ValueRuleValue<UpdateTypeType>[];
};

export const isUpdateListType = typia.createIs<UpdateListType>();

export const makeUpdateListRule = (): AssignForValueRule<UpdateListTypeClass, UpdateListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateListTypeClass),
        construct: (listTypeClass: UpdateListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeUpdateTypeRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

export type ValueListType = CommonType & {
    value: ValueRuleValue<ValueType>[];
};

export const isValueListType = typia.createIs<ValueListType>();

export const makeValueListRule = (): AssignForValueRule<ValueListTypeClass, ValueListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isValueListTypeClass),
        construct: (listTypeClass: ValueListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeValueRule(), makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };
};

