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

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { soqlIdConvert } from './id';
import { fieldNameConvert } from './name';
import { SoqlFunctionClass,SubQueryClass soqlFunctionConvert, subQueryConvert } from './query';
import { TypeOfClass, typeOfConvert } from './clause';

export class EntryClass extends CommonClass {
    private value: string[] | SoqlFunction | SubQuery | TypeOf | null = null;
    private alias: string | null = null;

    setValue(value: string[] | SoqlFunction | SubQuery | TypeOf | null): void {
        this.value = value;
    }

    setAlias(alias: string | null): void {
        this.alias = alias;
    }

    getValue(): string | null {
        return this.value;
    }

    getAlias(): string | null {
        return this.alias;
    }

    copy(commonClass: EntryClass): void {
        this.setValue(commonClass.getValue());
        this.setAlias(commonClass.getAlias());
    }
}

export const isEntryClass = (target: CommonClass): target is EntryClass => {
    return isCommonClass(target,EntryClass);
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

export const subFieldEntryConvert = (
    target: SubFieldEntryTypeClass,
    errorClass: ErrorTypeClass[],
): SelectEntry => {
    const subFieldEntry: SelectEntry = {};

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
