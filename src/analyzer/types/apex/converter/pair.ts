import typia from 'typia';

import {
    ErrorTypeClass,
    ElementValuePairTypeClass,
    ElementValuePairsTypeClass,
    IdCreatedNamePairTypeClass,
    MapCreatorRestPairTypeClass,
    isAnyIdType,
    isElementValuePairType,
    isElementValueType,
    isExpressionTypeAll,
    isNormalIdType,
    isTypeListType,
    AnyIdTypeClass,
    TypeListTypeClass,
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
} from './commons';
import {
    AllExpressionClass,
    AllExpressionJson,
    ExpressionClass,
    expressionConvert,
    expressionRules,
    isExpressionTypeClass,
} from './expression';
import { AnyIdClass, anyIdConvert, AnyIdJson, normalIdConvert } from './id';
import { isTypeListClass, TypeListClass, typeListConvert, TypeListJson } from './list';
import { NormalLiteralClass } from './literal';
import { TypeRefClass } from './type';
import { elementValueConvert } from './value';

export class ElementValuePairClass extends CommonClass {
    private left: string | null = null;
    private right: NormalLiteralClass = new NormalLiteralClass();

    setLeft(left: string | null): void {
        this.left = left;
    }

    setRight(right: NormalLiteralClass): void {
        this.right.copy(right);
    }

    getLeft(): string | null {
        return this.left;
    }

    getRight(): NormalLiteralClass {
        return this.right;
    }

    copy(commonClass: ElementValuePairClass): void {
        this.setLeft(commonClass.getLeft());
        this.setRight(commonClass.getRight());
    }
}

export const isElementValuePairClass = (target: any): target is ElementValuePairClass => {
    return isCommonClass(target, ElementValuePairClass);
};

export const isElementValuePairClassArray = (target: any): target is ElementValuePairClass[] => {
    return Array.isArray(target) && target.every((t) => isElementValuePairClass(t));
};

export const elementValuePairConvert = (
    target: ElementValuePairTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePairClass => {
    const elementValuePair = new ElementValuePairClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isNormalIdType, errorClass);
    if (leftTypeClass) {
        elementValuePair.setLeft(normalIdConvert(leftTypeClass));
    }

    const rightTypeClass = toTypeClass(target.getRight(), isElementValueType, errorClass);
    if (rightTypeClass) {
        elementValuePair.setRight(elementValueConvert(rightTypeClass, errorClass));
    }

    return elementValuePair;
};

export const elementValuePairsConvert = (
    target: ElementValuePairsTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePairClass[] => {
    const values: ElementValuePairClass[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isElementValuePairType, errorClass);
        if (valueTypeClass) {
            values.push(elementValuePairConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type IdCreatedNamePairJson = CommonJson<'idCreatedNamePair'> & {
    collection: Omit<AnyIdJson, 'sourceSpan'> | null;
    generic?: Omit<TypeListJson, 'sourceSpan'> | null;
};
export const isIdCreatedNamePairJson = typia.createIs<IdCreatedNamePairJson>();

export const isIdCreatedNamePairClass = (target: unknown): target is IdCreatedNamePairClass => {
    return target instanceof IdCreatedNamePairClass;
};

export class IdCreatedNamePairClass extends CommonBaseClass<
    'idCreatedNamePair',
    IdCreatedNamePairJson
> {
    private collection: AnyIdClass | null;
    private generic: TypeListClass | null | undefined;

    constructor(target: IdCreatedNamePairTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const collection = assignClass(
            target.getLeft(),
            (target: unknown) => isTargetTypeClass(target, isAnyIdType),
            (typeClass: AnyIdTypeClass) => new AnyIdClass(typeClass),
        );
        if (isErrorInfo(collection)) {
            errorInfo.push(collection);
        } else {
            sourceSpan = { ...sourceSpan, collection: collection.getSourceSpan() };
            assignIndex++;
        }

        const generic = assignClassWithNull(
            target.getRight(),
            (target: unknown) => isTargetTypeClass(target, isTypeListType),
            (typeClass: TypeListTypeClass) => new TypeListClass(typeClass),
        );
        if (isErrorInfo(generic)) {
            errorInfo.push(generic);
        } else if (isTypeListClass(generic)) {
            sourceSpan = {
                ...sourceSpan,
                generic: generic.getSourceSpan(),
            };
            assignIndex++;
        }

        super(
            'idCreatedNamePair',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.collection = !isErrorInfo(collection) ? collection : null;
        this.generic = !isErrorInfo(generic) ? (generic !== null ? generic : null) : undefined;
    }

    toJson(): IdCreatedNamePairJson {
        let collection: Omit<AnyIdJson, 'sourceSpan'> | null = null;
        if (this.collection) {
            const { sourceSpan, ...rest } = this.collection.toJson();
            collection = rest;
        }

        const json: IdCreatedNamePairJson = {
            type: 'idCreatedNamePair',
            collection: collection,
            sourceSpan: this.getSourceSpan(),
        };

        if (this.generic !== undefined) {
            if (this.generic) {
                const { sourceSpan, ...rest } = this.generic.toJson();
                json.generic = rest;
            } else {
                json.generic = null;
            }
        }

        return json;
    }
}

export type MapCreatorRestPairJson = CommonJson<'mapCreatorRestPair'> & {
    key: Omit<AllExpressionJson, 'sourceSpan'> | null;
    value: Omit<AllExpressionJson, 'sourceSpan'> | null;
};
export const isMapCreatorRestPairJson = typia.createIs<MapCreatorRestPairJson>();
export const isMapCreatorRestPairClass = (target: unknown): target is MapCreatorRestPairClass => {
    return target instanceof MapCreatorRestPairClass;
};

export class MapCreatorRestPairClass extends CommonBaseClass<
    'mapCreatorRestPair',
    MapCreatorRestPairJson
> {
    private key: AllExpressionClass | null;
    private value: AllExpressionClass | null;

    constructor(target: MapCreatorRestPairTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const key = assignElementClass(target.getLeft(), isExpressionTypeClass, expressionRules);

        if (isErrorInfo(key)) {
            errorInfo.push(key);
        } else {
            sourceSpan = { ...sourceSpan, key: key.getSourceSpan() };
            assignIndex++;
        }

        const value = assignElementClass(target.getRight(), isExpressionTypeClass, expressionRules);

        if (isErrorInfo(value)) {
            errorInfo.push(value);
        } else {
            sourceSpan = { ...sourceSpan, value: value.getSourceSpan() };
            assignIndex++;
        }

        super(
            'mapCreatorRestPair',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.key = !isErrorInfo(key) ? key : null;
        this.value = !isErrorInfo(value) ? value : null;
    }

    toJson(): MapCreatorRestPairJson {
        let key: Omit<AllExpressionJson, 'sourceSpan'> | null = null;
        if (this.key) {
            const { sourceSpan, ...rest } = this.key.toJson();
            key = rest;
        }

        let value: Omit<AllExpressionJson, 'sourceSpan'> | null = null;
        if (this.value) {
            const { sourceSpan, ...rest } = this.value.toJson();
            value = rest;
        }

        return {
            type: 'mapCreatorRestPair',
            key: key,
            value: value,
            sourceSpan: this.getSourceSpan(),
        };
    }
}
