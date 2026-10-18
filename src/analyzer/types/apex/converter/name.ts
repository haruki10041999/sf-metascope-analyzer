import typia from 'typia';

import {
    ErrorTypeClass,
    QualifiedNameTypeClass,
    TypeNameTypeClass,
    CreatedNameTypeClass,
    FieldNameTypeClass,
    DateFieldNameTypeClass,
    DataCategoryNameTypeClass,
    isNormalIdType,
    isSoqlIdType,
    isTypeArgumentsType,
    isIdCreatedNamePairType,
    isFieldNameType,
    NormalIdTypeClass,
    TypeArgumentsTypeClass,
    IdCreatedNamePairTypeClass,
} from '../../apex_IR';

import {
    toPrimitiveValue,
    SourceSpanInfo,
    CommonBaseClass,
    ElementBaseClass,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
    assignClass,
    assignClassWithNull,
    assignClassToElementClass,
    assignElementClass,
    isTargetTypeClass,
    assignMultiClass,
    assignClassArray,
} from './commons';
import { IdClass, IdJson, isIdClass, isString, normalIdConvert, soqlIdConvert } from './id';
import { TypeRefClass } from './type';
import {
    isTypeArgumentsClass,
    TypeArgumentsClass,
    typeArgumentsConvert,
    TypeArgumentsJson,
} from './arguments';
import {
    IdCreatedNamePairClass,
    idCreatedNamePairConvert,
    IdCreatedNamePairJson,
    isIdCreatedNamePairJson,
} from './pair';

export const qualifiedNameConvert = (
    target: QualifiedNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (valueTypeClass) {
            values.push(normalIdConvert(valueTypeClass));
        }
    });
    return values;
};

export type TypeNameJson = CommonJson<'typeName'> & {
    collection: string | Omit<IdJson, 'sourceSpan'> | null;
    generic?: Omit<TypeArgumentsJson, 'sourceSpan'> | null;
};
export const isTypeNameJson = typia.createIs<TypeNameJson>();

export const isTypeNameClass = (target: unknown): target is TypeNameClass => {
    return target instanceof TypeNameClass;
};

export class TypeNameClass extends CommonBaseClass<'typeName', TypeNameJson> {
    private collection: string | IdClass | null;
    private generic: TypeArgumentsClass | null | undefined;

    constructor(target: TypeNameTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const collection = assignMultiClass(target.getValue(), [
            {
                isValid: (target: unknown) => isString(target),
                construct: (typeClass: string) => {
                    return typeClass;
                },
            },
            {
                isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
                construct: (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
            },
        ]);
        if (isErrorInfo(collection)) {
            errorInfo.push(collection);
        } else if (isString(collection) || isIdClass(collection)) {
            sourceSpan = {
                ...sourceSpan,
                collection: isString(collection) ? collection : collection.getSourceSpan(),
            };
            assignIndex++;
        }

        const generic = assignClassWithNull(
            target.getGeneric(),
            (target: unknown) => isTargetTypeClass(target, isTypeArgumentsType),
            (typeClass: TypeArgumentsTypeClass) => new TypeArgumentsClass(typeClass),
        );
        if (isErrorInfo(generic)) {
            errorInfo.push(generic);
        } else if (isTypeArgumentsClass(generic)) {
            sourceSpan = { ...sourceSpan, generic: generic.getSourceSpan() };
            assignIndex++;
        }

        super(
            'typeName',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.collection = !isErrorInfo(collection) ? collection : null;
        this.generic = !isErrorInfo(generic) ? (generic !== null ? generic : null) : undefined;
    }

    toJson(): TypeNameJson {
        let collection: string | Omit<IdJson, 'sourceSpan'> | null = null;
        if (isIdClass(this.collection)) {
            const { sourceSpan, ...rest } = this.collection.toJson();
            collection = rest;
        } else {
            collection = this.collection;
        }

        const json: TypeNameJson = {
            type: 'typeName',
            collection: collection,
            sourceSpan: this.getSourceSpan(),
        };

        if (this.generic !== undefined) {
            if (this.generic) {
                const { sourceSpan, ...rest } = this.generic.toJson();
                json.generic = rest;
            } else {
                json.generic = this.generic;
            }
        }

        return json;
    }
}

export type CreatedNameJson = CommonJson<'createdName'> & {
    createdName: (Omit<IdCreatedNamePairJson, 'sourceSpan'> | null)[];
};
export const isCreatedNameJson = typia.createIs<CreatedNameJson>();
export const isCreatedNameClass = (target: unknown): target is CreatedNameClass => {
    return target instanceof CreatedNameClass;
};

export class CreatedNameClass extends CommonBaseClass<'createdName', CreatedNameJson> {
    private createdName: (IdCreatedNamePairClass | null)[];

    constructor(target: CreatedNameTypeClass) {
        const createdName: (IdCreatedNamePairClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        const CreatedNameValue = assignClassArray(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairType),
            (typeClass: IdCreatedNamePairTypeClass) => new IdCreatedNamePairClass(typeClass),
        );
        CreatedNameValue.forEach((c) => {
            if (isErrorInfo(c)) {
                errorInfo.push(c);
                createdName.push(null);
            } else {
                sourceSpanArray.push({ createdName: c.getSourceSpan() });
                createdName.push(c);
            }
        });

        super(
            'createdName',
            sourceSpanArray.length !== createdName.filter((c) => c !== null).length
                ? { content: target.getSpan()!, typeList: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.createdName = createdName;
    }

    toJson(): CreatedNameJson {
        return {
            type: 'createdName',
            createdName: this.createdName.map((c) => {
                if (c) {
                    const { sourceSpan, ...rest } = c.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export const fieldNameConvert = (
    target: FieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isSoqlIdType(valueTypeClass)) {
                const soqlId = soqlIdConvert(valueTypeClass, errorClass);
                if (soqlId) {
                    values.push(soqlId);
                }
            }
        }
    });

    return values;
};

export class DateFieldNameClass extends CommonClass {
    private value: string[] = [];
    private isConvertTimeZone: boolean | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    setIsConvertTimeZone(isConvertTimeZone: boolean | null): void {
        this.isConvertTimeZone = isConvertTimeZone;
    }

    getValue(): string[] {
        return this.value;
    }

    getIsConvertTimeZone(): boolean | null {
        return this.isConvertTimeZone;
    }

    copy(commonClass: DateFieldNameClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setIsConvertTimeZone(commonClass.getIsConvertTimeZone());
    }
}

export const isDateFieldNameClass = (target: any): target is DateFieldNameClass => {
    return isCommonClass(target, DateFieldNameClass);
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): DateFieldNameClass => {
    const dateFieldName = new DateFieldNameClass();

    dateFieldName.setIsConvertTimeZone(target.getConvertTimeZone());

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        dateFieldName.setValue(fieldNameConvert(valueTypeClass, errorClass));
    }
    return dateFieldName;
};

export const dataCategoryNameConvert = (
    target: DataCategoryNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            const soqlId = soqlIdConvert(valueTypeClass, errorClass);
            if (soqlId) {
                values.push(soqlId);
            }
        }
    });

    return values;
};
