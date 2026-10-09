import {
    ErrorTypeClass,
    TypeListTypeClass,
    ExpressionListTypeClass,
    FormalParameterListTypeClass,
    ValueListTypeClass,
    FieldNameListTypeClass,
    UpdateListTypeClass,
    NetworkListTypeClass,
    FieldGroupByListTypeClass,
    FieldOrderListTypeClass,
    SelectListTypeClass,
    SubFieldListTypeClass,
    FieldListTypeClass,
    FieldSpecListTypeClass,
    FromNameListTypeClass,
    FromNameTypeClass,
    SoslFieldTypeClass,
    SoslIdTypeClass,
    SoqlFunctionTypeClass,
    isTypeRefType,
    isExpressionTypeAll,
    isUpdateTypeType,
    isFormalParameterType,
    isSoslFieldType,
    isSoslIdType,
    isSoqlFunctionType,
    isSoqlIdType,
    isNormalValueType,
    isFieldNameType,
    isFieldGroupByType,
    isFieldOrderType,
    isSelectEntryType,
    isSubFieldEntryType,
    isFieldSpecType,
    isFromNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { Expression, expressionConvert } from './expression';
import { SoqlId, soqlIdConvert, SoslId, soslIdConvert } from './id';
import { FieldName, fieldNameConvert } from './name';
import { typeRefConvert, TypeRef } from './type';
import { NormalValue, normalValueConvert } from './value';
import { FormalParameter, formalParameterConvert } from './parameter';
import {
    FieldGroupBy,
    fieldGroupByConvert,
    FieldOrder,
    fieldOrderConvert,
    UpdateType,
    updateTypeConvert,
} from './clause';
import { SelectEntry, selectEntryConvert, SubFieldEntry, subFieldEntryConvert } from './entry';
import { FieldSpec, fieldSpecConvert, SoqlFunction, soqlFunctionConvert } from './query';

export type TypeList = TypeRef[];

export const typeListConvert = (
    target: TypeListTypeClass,
    errorClass: ErrorTypeClass[],
): TypeList => {
    const values: TypeRef[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeRefType, errorClass);
        if (valueTypeClass) {
            values.push(typeRefConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type ExpressionList = Expression[] | undefined;

export const expressionListConvert = (
    target: ExpressionListTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionList => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FormalParameterList = FormalParameter[] | undefined;

export const formalParameterListConvert = (
    target: FormalParameterListTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameterList => {
    const values: FormalParameter[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFormalParameterType, errorClass);
        if (valueTypeClass) {
            values.push(formalParameterConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type ValueList = NormalValue[] | undefined;

export const valueListConvert = (
    target: ValueListTypeClass,
    errorClass: ErrorTypeClass[],
): ValueList => {
    const values: NormalValue[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalValueType, errorClass);
        if (valueTypeClass) {
            values.push(normalValueConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FieldNameList = FieldName[] | undefined;

export const fieldNameListConvert = (
    target: FieldNameListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldNameList => {
    const values: FieldName[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldNameType, errorClass);
        if (valueTypeClass) {
            values.push(fieldNameConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type UpdateList = UpdateType[] | undefined;

export const updateListConvert = (
    target: UpdateListTypeClass,
    errorClass: ErrorTypeClass[],
): UpdateList => {
    const values: UpdateType[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isUpdateTypeType, errorClass);
        const value = valueTypeClass ? updateTypeConvert(valueTypeClass, errorClass) : undefined;
        if (value) {
            values.push(value);
        }
    });
    return values.length > 0 ? values : undefined;
};

export type NetworkList = string[] | undefined;

export const networkListConvert = (
    target: NetworkListTypeClass,
    errorClass: ErrorTypeClass[],
): NetworkList => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const value = toPrimitiveValue(
            item,
            (target): target is string => typeof target === 'string',
            errorClass,
        );
        if (value) {
            values.push(value);
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FieldGroupByList = FieldGroupBy[] | undefined;

export const fieldGroupByListConvert = (
    target: FieldGroupByListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldGroupByList => {
    const values: FieldGroupBy[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldGroupByType, errorClass);
        if (valueTypeClass) {
            values.push(fieldGroupByConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FieldOrderList = FieldOrder[] | undefined;

export const fieldOrderListConvert = (
    target: FieldOrderListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrderList => {
    const values: FieldOrder[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldOrderType, errorClass);
        if (valueTypeClass) {
            values.push(fieldOrderConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type SelectList = SelectEntry[] | undefined;

export const selectListConvert = (
    target: SelectListTypeClass,
    errorClass: ErrorTypeClass[],
): SelectList => {
    const values: SelectEntry[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSelectEntryType, errorClass);
        if (valueTypeClass) {
            values.push(selectEntryConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type SubFieldList = SubFieldEntry[] | undefined;

export const subFieldListConvert = (
    target: SubFieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SubFieldList => {
    const values: SubFieldEntry[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSubFieldEntryType, errorClass);
        if (valueTypeClass) {
            values.push(subFieldEntryConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type SoslField = {
    value: SoslId | SoqlFunction | undefined;
    func: string | undefined;
};

export const soslFieldConvert = (
    target: SoslFieldTypeClass,
    errorClass: ErrorTypeClass[],
): SoslField => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is SoslIdTypeClass | SoqlFunctionTypeClass =>
            isSoslIdType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    let value: SoslField['value'] = undefined;
    if (valueTypeClass) {
        if (isSoslIdType(valueTypeClass)) {
            value = soslIdConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
    }

    return {
        value: value,
        func: target.getFunc() ?? undefined,
    };
};

export type FieldList = SoslField[] | undefined;

export const fieldListConvert = (
    target: FieldListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldList => {
    const values: SoslField[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoslFieldType, errorClass);
        if (valueTypeClass) {
            values.push(soslFieldConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FieldSpecList = FieldSpec[] | undefined;

export const fieldSpecListConvert = (
    target: FieldSpecListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpecList => {
    const values: FieldSpec[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldSpecType, errorClass);
        if (valueTypeClass) {
            values.push(fieldSpecConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FromName = {
    value: FieldName;
    alias: SoqlId;
};

export const fromNameConvert = (
    target: FromNameTypeClass,
    errorClass: ErrorTypeClass[],
): FromName => {
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);

    const aliasValue = target.getAlias();
    const aliasTypeClass = aliasValue
        ? toTypeClass(aliasValue, isSoqlIdType, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? fieldNameConvert(valueTypeClass, errorClass) : undefined,
        alias: aliasTypeClass ? soqlIdConvert(aliasTypeClass, errorClass) : undefined,
    };
};

export type FromNameList = FromName[] | undefined;

export const fromNameListConvert = (
    target: FromNameListTypeClass,
    errorClass: ErrorTypeClass[],
): FromNameList => {
    const values: FromName[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFromNameType, errorClass);
        if (valueTypeClass) {
            values.push(fromNameConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};
