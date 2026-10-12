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
import { isStringArray, soqlIdConvert } from './id';
import { fieldNameConvert } from './name';
import {
    SoqlFunctionClass,
    SubQueryClass,
    isSoqlFunctionClass,
    isSubQueryClass,
    soqlFunctionConvert,
    subQueryConvert,
} from './query';
import { isTypeOfClass, TypeOfClass, typeOfConvert } from './clause';

export class EntryClass extends CommonClass {
    private value: string[] | SoqlFunctionClass | SubQueryClass | TypeOfClass | null = null;
    private alias: string | null = null;

    setValue(value: string[] | SoqlFunctionClass | SubQueryClass | TypeOfClass | null): void {
        if (isStringArray(this.value) && isStringArray(value)) {
            this.value.push(...value);
        } else if (isSoqlFunctionClass(this.value) && isSoqlFunctionClass(value)) {
            this.value.copy(value);
        } else if (isSubQueryClass(this.value) && isSubQueryClass(value)) {
            this.value.copy(value);
        } else if (isTypeOfClass(this.value) && isTypeOfClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setAlias(alias: string | null): void {
        this.alias = alias;
    }

    getValue(): string[] | SoqlFunctionClass | SubQueryClass | TypeOfClass | null {
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

export const isEntryClass = (target: any): target is EntryClass => {
    return isCommonClass(target, EntryClass);
};

export const isEntryClassArray = (target: any): target is EntryClass[] => {
    return Array.isArray(target) && target.every((t) => isEntryClass(t));
};

export const selectEntryConvert = (
    target: SelectEntryTypeClass,
    errorClass: ErrorTypeClass[],
): EntryClass => {
    const selectEntry = new EntryClass();

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
            selectEntry.setValue(fieldNameConvert(valueTypeClass, errorClass));
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            selectEntry.setValue(soqlFunctionConvert(valueTypeClass, errorClass));
        }
        if (isSubQueryType(valueTypeClass)) {
            selectEntry.setValue(subQueryConvert(valueTypeClass, errorClass));
        }
        if (isTypeOfType(valueTypeClass)) {
            selectEntry.setValue(typeOfConvert(valueTypeClass, errorClass));
        }
    }

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const aliasTypeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (aliasTypeClass) {
            selectEntry.setAlias(soqlIdConvert(aliasTypeClass, errorClass));
        }
    }

    return selectEntry;
};

export const subFieldEntryConvert = (
    target: SubFieldEntryTypeClass,
    errorClass: ErrorTypeClass[],
): EntryClass => {
    const subFieldEntry = new EntryClass();

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
            subFieldEntry.setValue(fieldNameConvert(valueTypeClass, errorClass));
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            subFieldEntry.setValue(soqlFunctionConvert(valueTypeClass, errorClass));
        }
        if (isSubQueryType(valueTypeClass)) {
            subFieldEntry.setValue(subQueryConvert(valueTypeClass, errorClass));
        }
        if (isTypeOfType(valueTypeClass)) {
            subFieldEntry.setValue(typeOfConvert(valueTypeClass, errorClass));
        }
    }

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const aliasTypeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (aliasTypeClass) {
            subFieldEntry.setAlias(soqlIdConvert(aliasTypeClass, errorClass));
        }
    }

    return subFieldEntry;
};
