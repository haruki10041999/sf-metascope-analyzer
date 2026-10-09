import {
    ErrorTypeClass,
    SelectEntryTypeClass,
    SubFieldEntryTypeClass,
    FieldNameTypeClass,
    SoqlFunctionTypeClass,
    SubQueryTypeClass,
    TypeOfTypeClass,
    SoqlIdTypeClass,
    isFieldNameType,
    isSoqlFunctionType,
    isSoqlIdType,
    isSubQueryType,
    isTypeOfType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { SoqlId, soqlIdConvert } from './id';
import { FieldName, fieldNameConvert } from './name';
import { SoqlFunction, soqlFunctionConvert, SubQuery, subQueryConvert } from './query';
import { TypeOf, typeOfConvert } from './clause';

type EntryValue = FieldName | SoqlFunction | SubQuery | TypeOf | undefined;

type Entry = {
    value: EntryValue;
    alias: SoqlId;
};

const entryConvert = (
    target: SelectEntryTypeClass | SubFieldEntryTypeClass,
    errorClass: ErrorTypeClass[],
): Entry => {
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

    let value: EntryValue = undefined;
    if (valueTypeClass) {
        if (isFieldNameType(valueTypeClass)) {
            value = fieldNameConvert(valueTypeClass, errorClass);
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            value = soqlFunctionConvert(valueTypeClass, errorClass);
        }
        if (isSubQueryType(valueTypeClass)) {
            value = subQueryConvert(valueTypeClass, errorClass);
        }
        if (isTypeOfType(valueTypeClass)) {
            value = typeOfConvert(valueTypeClass, errorClass);
        }
    }

    const aliasValue: SoqlIdTypeClass | ErrorTypeClass | null | undefined = target.getAlias();
    const aliasTypeClass = aliasValue
        ? toTypeClass(aliasValue, isSoqlIdType, errorClass)
        : undefined;

    return {
        value: value,
        alias: aliasTypeClass ? soqlIdConvert(aliasTypeClass, errorClass) : undefined,
    };
};

export type SelectEntry = Entry;

export const selectEntryConvert = (
    target: SelectEntryTypeClass,
    errorClass: ErrorTypeClass[],
): SelectEntry => {
    return entryConvert(target, errorClass);
};

export type SubFieldEntry = Entry;

export const subFieldEntryConvert = (
    target: SubFieldEntryTypeClass,
    errorClass: ErrorTypeClass[],
): SubFieldEntry => {
    return entryConvert(target, errorClass);
};
