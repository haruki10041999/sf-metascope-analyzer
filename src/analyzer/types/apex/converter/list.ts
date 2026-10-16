import typia from 'typia';

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

import {
    toPrimitiveValue,
    toTypeClass,
    SourceSpanInfo,
    CommonClass,
    ElementClass,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
} from './commons';
import { IdClass, IdJson, AnyIdClass, AnyIdJson } from './id';
import {
    ExpressionElementClass,
    AllExpressionJson,
    AllExpressionClass,
    isExpressionTypeClass,
} from './expression';
import { fieldNameConvert } from './name';
import { TypeRefClass, typeRefConvert } from './type';
import { NormalValueClass, normalValueConvert } from './value';
import { FormalParameterClass, formalParameterConvert } from './parameter';
import {
    FieldOrderClass,
    fieldGroupByConvert,
    fieldOrderConvert,
    updateTypeConvert,
} from './clause';
import { EntryClass, selectEntryConvert, subFieldEntryConvert } from './entry';
import {
    FieldSpecClass,
    SoqlFunctionClass,
    fieldSpecConvert,
    isSoqlFunctionClass,
    soqlFunctionConvert,
} from './query';

export const typeListConvert = (
    target: TypeListTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefClass[] => {
    const values: TypeRefClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeRefType, errorClass);
        if (valueTypeClass) {
            values.push(typeRefConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type ExpressionListJson = CommonJson<'expressionList'> & {
    expressionList: Omit<AllExpressionJson, 'sourceSpan'>[];
};
export const isExpressionListJson = typia.createIs<ExpressionListJson>();

export class ExpressionListClass implements CommonClass<'expressionList', ExpressionListJson> {
    private value: AllExpressionClass[] = [];
    private sourceSpan: SourceSpanInfo | SourceSpanInfo[];
    private errorInfo: ErrorInfo[] = [];

    constructor(target: ExpressionListTypeClass) {
        const sourceSpanArray: SourceSpanInfo[] = [];

        target.getValue().forEach((value) => {
            const expressionValue = toTypeClass(value, isExpressionTypeClass);
            if (isErrorInfo(expressionValue)) {
                this.errorInfo.push(expressionValue);
            } else {
                const expressionClass = new ExpressionElementClass(
                    expressionValue,
                ).getCommonClass();
                this.value.push(expressionClass);
                sourceSpanArray.push({
                    [expressionClass.getType()]: expressionClass.getSourceSpan(),
                });
            }
        });

        if (sourceSpanArray.length > 0) {
            this.sourceSpan = sourceSpanArray;
        } else {
            this.sourceSpan = { content: target.getSpan()! };
        }
    }
    getErrorInfo(): ErrorInfo[] {
        return this.errorInfo;
    }

    getType(): 'expressionList' {
        return 'expressionList';
    }

    getValue(): AllExpressionClass[] {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[] {
        return this.sourceSpan;
    }

    toJson(): ExpressionListJson {
        return {
            type: 'expressionList',
            sourceSpan: this.sourceSpan,
            expressionList: this.value.map((expressionClass) => {
                const { sourceSpan, ...rest } = expressionClass.toJson();
                return rest;
            }),
        };
    }
}

export const formalParameterListConvert = (
    target: FormalParameterListTypeClass,
    errorClass: ErrorTypeClass[],
): FormalParameterClass[] => {
    const values: FormalParameterClass[] = [];
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
): NormalValueClass[] => {
    const values: NormalValueClass[] = [];
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
): (string[] | SoqlFunctionClass)[] => {
    const values: (string[] | SoqlFunctionClass)[] = [];
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
): FieldOrderClass[] => {
    const values: FieldOrderClass[] = [];
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
): EntryClass[] => {
    const values: EntryClass[] = [];
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
): EntryClass[] => {
    const values: EntryClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSubFieldEntryType, errorClass);
        if (valueTypeClass) {
            values.push(subFieldEntryConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export class SoslFieldClass extends CommonClass {
    private value: string[] | SoqlFunctionClass | null = null;
    private func: string | null = null;

    setValue(value: string[] | SoqlFunctionClass | null): void {
        if (isStringArray(this.value) && isStringArray(value)) {
            this.value.push(...value);
        } else if (isSoqlFunctionClass(this.value) && isSoqlFunctionClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setFunc(func: string | null): void {
        this.func = func;
    }

    getValue(): string[] | SoqlFunctionClass | null {
        return this.value;
    }

    getFunc(): string | null {
        return this.func;
    }

    copy(commonClass: SoslFieldClass): void {
        this.setValue(commonClass.getValue());
        this.setFunc(commonClass.getFunc());
    }
}

export const isSoslFieldClass = (target: any): target is SoslFieldClass => {
    return isCommonClass(target, SoslFieldClass);
};

export const isSoslFieldClassArray = (target: any): target is SoslFieldClass => {
    return Array.isArray(target) && target.every((t) => isSoslFieldClass(t));
};

export const soslFieldConvert = (
    target: SoslFieldTypeClass,
    errorClass: ErrorTypeClass[],
): SoslFieldClass => {
    const soslField = new SoslFieldClass();
    soslField.setFunc(target.getFunc());

    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is SoslIdTypeClass | SoqlFunctionTypeClass =>
            isSoslIdType(target) || isSoqlFunctionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isSoslIdType(valueTypeClass)) {
            soslField.setValue(soslIdConvert(valueTypeClass, errorClass));
        }
        if (isSoqlFunctionType(valueTypeClass)) {
            soslField.setValue(soqlFunctionConvert(valueTypeClass, errorClass));
        }
    }

    return soslField;
};

export const fieldListConvert = (
    target: FieldListTypeClass,
    errorClass: ErrorTypeClass[],
): SoslFieldClass[] => {
    const values: SoslFieldClass[] = [];
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
): FieldSpecClass[] => {
    const values: FieldSpecClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFieldSpecType, errorClass);
        if (valueTypeClass) {
            values.push(fieldSpecConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export class FromNameClass extends CommonClass {
    private value: string[] = [];
    private alias: string | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    setAlias(alias: string | null): void {
        this.alias = alias;
    }

    getValue(): string[] {
        return this.value;
    }

    getAlias(): string | null {
        return this.alias;
    }

    copy(commonClass: FromNameClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setAlias(commonClass.getAlias());
    }
}

export const isFromNameClass = (target: any): target is FromNameClass => {
    return isCommonClass(target, FromNameClass);
};

export const isFromNameClassArray = (target: any): target is FromNameClass[] => {
    return Array.isArray(target) && target.every((t) => isFromNameClass(t));
};

export const fromNameConvert = (
    target: FromNameTypeClass,
    errorClass: ErrorTypeClass[],
): FromNameClass => {
    const fromName = new FromNameClass();

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        fromName.setValue(fieldNameConvert(valueTypeClass, errorClass));
    }

    const aliasValue = target.getAlias();
    if (aliasValue) {
        const typeClass = toTypeClass(aliasValue, isSoqlIdType, errorClass);
        if (typeClass) {
            fromName.setAlias(soqlIdConvert(typeClass, errorClass));
        }
    }

    return fromName;
};

export const fromNameListConvert = (
    target: FromNameListTypeClass,
    errorClass: ErrorTypeClass[],
): FromNameClass[] => {
    const values: FromNameClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isFromNameType, errorClass);
        if (valueTypeClass) {
            values.push(fromNameConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};
