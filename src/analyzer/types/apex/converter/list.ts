import {
    CommonTypeClass,
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
    isTypeListType,
    isExpressionListType,
    isFormalParameterListType,
    isFormalParameterType,
    isValueListType,
    isFieldNameListType,
    isUpdateListType,
    isNetworkListType,
    isFieldGroupByListType,
    isFieldOrderListType,
    isSelectListType,
    isSubFieldListType,
    isFieldListType,
    isFieldSpecListType,
    TypeRefTypeClass,
    UpdateTypeTypeClass,
    isTypeRefType,
    isExpressionTypeAll,
    isUpdateTypeType,
    FormalParameterTypeClass,
    NormalValueTypeClass,
    FieldGroupByTypeClass,
    FieldOrderTypeClass,
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    SoslFieldTypeClass,
    isSoslFieldType,
    FieldSpecTypeClass,
    isNormalValueType,
    isFieldNameType,
    isFieldGroupByType,
    isFieldOrderType,
    isSelectEntryType,
    isSubFieldEntryType,
    isFieldSpecType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { expressionConvert } from './expression';
import { fieldNameConvert } from './name';

export const typeListConvert = (
    target: TypeListTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefTypeClass[] => {
    const values: TypeRefTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeRefType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const expressionListConvert = (
    target: ExpressionListTypeClass,
    errorClass: ErrorTypeClass[],
): any[] => {
    const values: CommonTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const formalParameterListConvert = (
    target: FormalParameterListTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameterTypeClass[] => {
    const values: FormalParameterTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFormalParameterType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const valueListConvert = (
    target: ValueListTypeClass,
    errorClass: ErrorTypeClass[],
): NormalValueTypeClass[] => {
    const values: NormalValueTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalValueType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
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
): UpdateTypeTypeClass[] => {
    const values: UpdateTypeTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isUpdateTypeType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
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
): FieldGroupByTypeClass[] => {
    const values: FieldGroupByTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldGroupByType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const fieldOrderListConvert = (
    target: FieldOrderListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldOrderTypeClass[] => {
    const values: FieldOrderTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldOrderType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const selectListConvert = (
    target: SelectListTypeClass,
    errorClass: ErrorTypeClass[],
): SelectEntryTypeClass[] => {
    const values: SelectEntryTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSelectEntryType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const subFieldListConvert = (
    target: SubFieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SubFieldEntryTypeClass[] => {
    const values: SubFieldEntryTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSubFieldEntryType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const fieldListConvert = (
    target: FieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SoslFieldTypeClass[] => {
    const values: SoslFieldTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoslFieldType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};

export const fieldSpecListConvert = (
    target: FieldSpecListTypeClass,
    errorClass: ErrorTypeClass[],
): FieldSpecTypeClass[] => {
    const values: FieldSpecTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldSpecType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values;
};
