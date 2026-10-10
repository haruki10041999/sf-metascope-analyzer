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
import { soqlIdConvert, soslIdConvert } from './id';
import { fieldNameConvert } from './name';
import { typeRefConvert, TypeRef } from './type';
import { NormalValue, normalValueConvert } from './value';
import { FormalParameter, formalParameterConvert } from './parameter';
import { fieldGroupByConvert, FieldOrder, fieldOrderConvert, updateTypeConvert } from './clause';
import { SelectEntry, selectEntryConvert, SubFieldEntry, subFieldEntryConvert } from './entry';
import { FieldSpec, fieldSpecConvert, SoqlFunction, soqlFunctionConvert } from './query';

export const typeListConvert = (
    target: TypeListTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRef[] => {
    const values: TypeRef[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeRefType, errorClass);
        if (valueTypeClass) {
            values.push(typeRefConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const expressionListConvert = (
    target: ExpressionListTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            const expression = expressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    return values;
};

export const formalParameterListConvert = (
    target: FormalParameterListTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameter[] => {
    const values: FormalParameter[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFormalParameterType, errorClass);
        if (valueTypeClass) {
            values.push(formalParameterConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const valueListConvert = (
    target: ValueListTypeClass,
    errorClass: ErrorTypeClass[],
): NormalValue[] => {
    const values: NormalValue[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalValueType, errorClass);
        if (valueTypeClass) {
            values.push(normalValueConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const fieldNameListConvert = (
    target: FieldNameListTypeClass,
    errorClass: ErrorTypeClass[],
): string[][] => {
    const values: string[][] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldNameType, errorClass);
        if (valueTypeClass) {
            values.push(fieldNameConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const updateListConvert = (
    target: UpdateListTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isUpdateTypeType, errorClass);
        if (valueTypeClass) {
            const updateType = updateTypeConvert(valueTypeClass, errorClass);
            if (updateType) {
                values.push(updateType);
            }
        }
    });
    return values;
};

export const networkListConvert = (
    target: NetworkListTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
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
    return values;
};

export const fieldGroupByListConvert = (
    target: FieldGroupByListTypeClass,
    errorClass: ErrorTypeClass[],
): (string[] | SoqlFunction)[] => {
    const values: (string[] | SoqlFunction)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldGroupByType, errorClass);
        if (valueTypeClass) {
            const fieldGroupBy = fieldGroupByConvert(valueTypeClass, errorClass);
            if (fieldGroupBy) {
                values.push(fieldGroupBy);
            }
        }
    });
    return values;
};

export const fieldOrderListConvert = (
    target: FieldOrderListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrder[] => {
    const values: FieldOrder[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldOrderType, errorClass);
        if (valueTypeClass) {
            values.push(fieldOrderConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const selectListConvert = (
    target: SelectListTypeClass,
    errorClass: ErrorTypeClass[],
): SelectEntry[] => {
    const values: SelectEntry[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSelectEntryType, errorClass);
        if (valueTypeClass) {
            values.push(selectEntryConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const subFieldListConvert = (
    target: SubFieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SubFieldEntry[] => {
    const values: SubFieldEntry[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSubFieldEntryType, errorClass);
        if (valueTypeClass) {
            values.push(subFieldEntryConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type SoslField = {
    value?: string[] | SoqlFunction;
    func?: string;
};

export const soslFieldConvert = (
    target: SoslFieldTypeClass,
    errorClass: ErrorTypeClass[],
): SoslField => {
    const soslField: SoslField = {};

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is SoslIdTypeClass | SoqlFunctionTypeClass =>
            isSoslIdType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isSoslIdType(valueTypeClass)) {
            soslField.value = soslIdConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            soslField.value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
    }

    return soslField;
};

export const fieldListConvert = (
    target: FieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SoslField[] => {
    const values: SoslField[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoslFieldType, errorClass);
        if (valueTypeClass) {
            values.push(soslFieldConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const fieldSpecListConvert = (
    target: FieldSpecListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpec[] => {
    const values: FieldSpec[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldSpecType, errorClass);
        if (valueTypeClass) {
            values.push(fieldSpecConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type FromName = {
    value: string[];
    alias?: string;
};

export const fromNameConvert = (
    target: FromNameTypeClass,
    errorClass: ErrorTypeClass[],
): FromName => {
    const values: string[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        values.push(...fieldNameConvert(valueTypeClass, errorClass));
    }

    const fromName: FromName = {
        value: values,
    };

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const typeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (typeClass) {
            const soqlId = soqlIdConvert(typeClass, errorClass);
            if (soqlId) {
                fromName.alias = soqlId;
            }
        }
    }

    return fromName;
};

export const fromNameListConvert = (
    target: FromNameListTypeClass,
    errorClass: ErrorTypeClass[],
): FromName[] => {
    const values: FromName[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFromNameType, errorClass);
        if (valueTypeClass) {
            values.push(fromNameConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};
