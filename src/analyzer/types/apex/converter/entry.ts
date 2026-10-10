import {
    ErrorTypeClass,
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    FieldNameTypeClass,
    SoqlFunctionTypeClass,
    SubQueryTypeClass,
    TypeOfTypeClass,
    isFieldNameType,
    isSoqlFunctionType,
    isSoqlIdType,
    isSubQueryType,
    isTypeOfType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { soqlIdConvert } from './id';
import { fieldNameConvert } from './name';
import { SoqlFunction, soqlFunctionConvert, SubQuery, subQueryConvert } from './query';
import { TypeOf, typeOfConvert } from './clause';

export type SelectEntry = {
    value?: string[] | SoqlFunction | SubQuery | TypeOf;
    alias?: string;
};

export const selectEntryConvert = (
    target: SelectEntryTypeClass,
    errorClass: ErrorTypeClass[],
): SelectEntry => {
    const selectEntry: SelectEntry = {};

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass =>
            isFieldNameType(target) ||
            isSoqlFunctionType(target) ||
            isSubQueryType(target) ||
            isTypeOfType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            selectEntry.value = fieldNameConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            selectEntry.value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
        if (isSubQueryType(valueTypeClass)) {
            selectEntry.value = subQueryConvert(valueTypeClass, errorClass);
        }
        if (isTypeOfType(valueTypeClass)) {
            selectEntry.value = typeOfConvert(valueTypeClass, errorClass);
        }
    }

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const aliasTypeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (aliasTypeClass) {
            const soqlId = soqlIdConvert(aliasTypeClass, errorClass);
            if (soqlId) {
                selectEntry.alias = soqlId;
            }
        }
    }

    return selectEntry;
};

export type SubFieldEntry = {
    value?: string[] | SoqlFunction | SubQuery | TypeOf;
    alias?: string;
};

export const subFieldEntryConvert = (
    target: SubFieldEntryTypeClass,
    errorClass: ErrorTypeClass[],
): SubFieldEntry => {
    const subFieldEntry: SubFieldEntry = {};

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (
            target,
        ): target is
            FieldNameTypeClass | SoqlFunctionTypeClass | SubQueryTypeClass | TypeOfTypeClass =>
            isFieldNameType(target) ||
            isSoqlFunctionType(target) ||
            isSubQueryType(target) ||
            isTypeOfType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            subFieldEntry.value = fieldNameConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            subFieldEntry.value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
        if (isSubQueryType(valueTypeClass)) {
            subFieldEntry.value = subQueryConvert(valueTypeClass, errorClass);
        }
        if (isTypeOfType(valueTypeClass)) {
            subFieldEntry.value = typeOfConvert(valueTypeClass, errorClass);
        }
    }

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const aliasTypeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (aliasTypeClass) {
            const soqlId = soqlIdConvert(aliasTypeClass, errorClass);
            if (soqlId) {
                subFieldEntry.alias = soqlId;
            }
        }
    }

    return subFieldEntry;
};
