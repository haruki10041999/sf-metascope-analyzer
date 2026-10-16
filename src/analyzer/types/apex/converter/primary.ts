import typia from 'typia';

import {
    ErrorTypeClass,
    CommonTypeClass,
    NormalPrimaryTypeClass,
    ThisPrimaryTypeClass,
    VoidPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SuperPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    IdPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    SoslPrimaryTypeClass,
    isNormalPrimaryType,
    isThisPrimaryType,
    isVoidPrimaryType,
    isSoqlPrimaryType,
    isSuperPrimaryType,
    isTypeRefPrimaryType,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isSoslPrimaryType,
    isNormalIdType,
    isSoqlLiteralType,
    isTypeRefType,
    isNormalLiteralType,
    isSoslLiteralType,
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
import { IdJson, IdClass, isString } from './id';
import { TypeRefClass, typeRefConvert } from './type';
import { NormalQueryClass } from './query';
import {
    NormalLiteralClass,
    SoslLiteralClass,
    normalLiteralConvert,
    soqlLiteralConvert,
    soslLiteralConvert,
} from './literal';

export type PrimaryJson = CommonJson<'primary'> & {
    primary: string | null;
};

export const isPrimaryJson = typia.createIs<PrimaryJson>();

class PrimaryClass implements CommonClass<'primary', PrimaryJson> {
    private value: string | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: NormalPrimaryTypeClass) {
        const value = toPrimitiveValue(target.getValue(), isString);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
        } else {
            this.errorInfo = null;
            this.value = value;
        }

        this.sourceSpan = { content: target.getSpan()! };
    }
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'primary' {
        return 'primary';
    }

    getValue(): string | null {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): PrimaryJson {
        return {
            type: 'primary',
            primary: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type ThisPrimaryJson = CommonJson<'thisPrimary'> & {
    thisPrimary: string | null;
};
export const isThisPrimaryJson = typia.createIs<ThisPrimaryJson>();

class ThisPrimaryClass implements CommonClass<'thisPrimary', ThisPrimaryJson> {
    private value: string | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: ThisPrimaryTypeClass) {
        const value = toPrimitiveValue(target.getValue(), isString);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
        } else {
            this.errorInfo = null;
            this.value = value;
        }

        this.sourceSpan = { content: target.getSpan()! };
    }
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'thisPrimary' {
        return 'thisPrimary';
    }

    getValue(): string | null {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): ThisPrimaryJson {
        return {
            type: 'thisPrimary',
            thisPrimary: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type VoidPrimaryJson = CommonJson<'voidPrimary'> & {
    voidPrimary: string | null;
};
export const isVoidPrimaryJson = typia.createIs<VoidPrimaryJson>();

class VoidPrimaryClass implements CommonClass<'voidPrimary', VoidPrimaryJson> {
    private value: string | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: VoidPrimaryTypeClass) {
        const value = toPrimitiveValue(target.getValue(), isString);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
        } else {
            this.errorInfo = null;
            this.value = value;
        }

        this.sourceSpan = { content: target.getSpan()! };
    }
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'voidPrimary' {
        return 'voidPrimary';
    }

    getValue(): string | null {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): VoidPrimaryJson {
        return {
            type: 'voidPrimary',
            voidPrimary: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type SuperPrimaryJson = CommonJson<'superPrimary'> & {
    superPrimary: string | null;
};
export const isSuperPrimaryJson = typia.createIs<SuperPrimaryJson>();

class SuperPrimaryClass implements CommonClass<'superPrimary', SuperPrimaryJson> {
    private value: string | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: SuperPrimaryTypeClass) {
        const value = toPrimitiveValue(target.getValue(), isString);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
        } else {
            this.errorInfo = null;
            this.value = value;
        }

        this.sourceSpan = { content: target.getSpan()! };
    }
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'superPrimary' {
        return 'superPrimary';
    }

    getValue(): string | null {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): SuperPrimaryJson {
        return {
            type: 'superPrimary',
            superPrimary: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type IdPrimaryJson = CommonJson<'idPrimary'> & { idPrimary?: Omit<IdJson, 'sourceSpan'> };

export const isIdPrimaryJson = typia.createIs<IdPrimaryJson>();

class IdPrimaryClass implements CommonClass<'idPrimary', IdPrimaryJson> {
    private value: IdClass | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: IdPrimaryTypeClass) {
        const value = toTypeClass(target.getValue(), isNormalIdType);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
            this.sourceSpan = { content: target.getSpan()! };
        } else {
            this.errorInfo = null;
            this.value = new IdClass(value);
            this.sourceSpan = { [this.value.getType()]: this.value.getSourceSpan() };
        }
    }
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'idPrimary' {
        return 'idPrimary';
    }

    getValue(): IdClass | null {
        return this.value;
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): IdPrimaryJson {
        const json: IdPrimaryJson = {
            type: 'idPrimary',
            sourceSpan: this.sourceSpan,
        };

        if (this.value) {
            const { sourceSpan, ...rest } = this.value.toJson();
            json.idPrimary = rest;
        }

        return json;
    }
}

export const soqlPrimaryConvert = (
    target: SoqlPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQueryClass => {
    const soqlPrimary = new NormalQueryClass();

    const valueTypeClass = toTypeClass(target.getValue(), isSoqlLiteralType, errorClass);
    if (valueTypeClass) {
        soqlPrimary.copy(soqlLiteralConvert(valueTypeClass, errorClass));
    }

    return soqlPrimary;
};

export const typeRefPrimaryConvert = (
    target: TypeRefPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefClass => {
    const typeRefPrimary = new TypeRefClass();

    const typeClass = toTypeClass(target.getValue(), isTypeRefType, errorClass);
    if (typeClass) {
        typeRefPrimary.copy(typeRefConvert(typeClass, errorClass));
    }

    return typeRefPrimary;
};

export const literalPrimaryConvert = (
    target: LiteralPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteralClass => {
    const literalPrimary = new NormalLiteralClass();

    const typeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (typeClass) {
        literalPrimary.copy(normalLiteralConvert(typeClass, errorClass));
    }

    return literalPrimary;
};

export const soslPrimaryConvert = (
    target: SoslPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralClass => {
    const soslPrimary = new SoslLiteralClass();

    const valueTypeClass = toTypeClass(target.getValue(), isSoslLiteralType, errorClass);
    if (valueTypeClass) {
        soslPrimary.copy(soslLiteralConvert(valueTypeClass, errorClass));
    }
    return soslPrimary;
};

export type AllPrimaryClass =
    PrimaryClass | ThisPrimaryClass | VoidPrimaryClass | IdPrimaryClass | SuperPrimaryClass;

export type AllPrimaryJson =
    PrimaryJson | ThisPrimaryJson | VoidPrimaryJson | IdPrimaryJson | SuperPrimaryJson;

export class PrimaryElementClass implements ElementClass<
    'primary' | 'thisPrimary' | 'voidPrimary' | 'idPrimary' | 'superPrimary',
    AllPrimaryClass
> {
    private commonClass: AllPrimaryClass;

    constructor(
        target:
            | NormalPrimaryTypeClass
            | ThisPrimaryTypeClass
            | VoidPrimaryTypeClass
            | IdPrimaryTypeClass
            | SuperPrimaryTypeClass,
    ) {
        if (isNormalPrimaryType(target)) {
            this.commonClass = new PrimaryClass(target);
            return;
        }

        if (isThisPrimaryType(target)) {
            this.commonClass = new ThisPrimaryClass(target);
            return;
        }

        if (isVoidPrimaryType(target)) {
            this.commonClass = new VoidPrimaryClass(target);
            return;
        }

        if (isIdPrimaryType(target)) {
            this.commonClass = new IdPrimaryClass(target);
            return;
        }

        if (isSuperPrimaryType(target)) {
            this.commonClass = new SuperPrimaryClass(target);
            return;
        }

        throw new Error('Unsupported primary type: ');
    }

    getCommonClass(): AllPrimaryClass {
        return this.commonClass;
    }
}

export const isPrimaryTypeClass = (
    target: any,
): target is
    | NormalPrimaryTypeClass
    | ThisPrimaryTypeClass
    | VoidPrimaryTypeClass
    | IdPrimaryTypeClass
    | SuperPrimaryTypeClass => {
    // | SoqlPrimaryTypeClass
    // | LiteralPrimaryTypeClass
    // | TypeRefPrimaryTypeClass
    // | SoslPrimaryTypeClass => {

    return (
        target instanceof CommonTypeClass ||
        isNormalPrimaryType(target) ||
        isThisPrimaryType(target) ||
        isVoidPrimaryType(target) ||
        isIdPrimaryType(target) ||
        isSuperPrimaryType(target)
        // isSoslPrimaryType(target) ||
        // isLiteralPrimaryType(target) ||
        // isTypeRefPrimaryType(target) ||
        // isSoqlPrimaryType(target)
    );
};
