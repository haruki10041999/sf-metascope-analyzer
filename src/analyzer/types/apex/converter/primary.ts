import {
    ErrorTypeClass,
    PrimaryTypeClass,
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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert } from './id';
import { TypeRefClass, typeRefConvert } from './type';
import { NormalQueryClass } from './query';
import {
    NormalLiteralClass,
    SoslLiteralClass,
    normalLiteralConvert,
    soqlLiteralConvert,
    soslLiteralConvert,
} from './literal';

export const normalPrimaryConvert = (
    target: NormalPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const thisPrimaryConvert = (
    target: ThisPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const voidPrimaryConvert = (
    target: VoidPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

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

export const superPrimaryConvert = (
    target: SuperPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
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

export const idPrimaryConvert = (
    target: IdPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | null => {
    const normalIdType = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    if (normalIdType) {
        return normalIdConvert(normalIdType);
    }
    return null;
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

export abstract class PrimaryElementClass<TType, TPrimay> extends CommonClass {
    private type: TType;
    private primary: TPrimay;

    constructor(type: TType, primary: TPrimay) {
        super();
        this.type = type;
        this.primary = primary;
    }

    getType(): TType {
        return this.type;
    }

    getPrimary(): TPrimay {
        return this.primary;
    }
}

export const isPrimaryElementClass = (
    target: CommonClass,
): target is PrimaryElementClass<unknown, unknown> => {
    return isCommonClass(target, PrimaryElementClass);
};

export class StringPrimaryElementClass extends PrimaryElementClass<
    'normal' | 'this' | 'void' | 'super' | 'id',
    string | null
> {
    constructor(type: 'normal' | 'this' | 'void' | 'super' | 'id', priamry: string | null) {
        super(type, priamry);
    }
}

export const isStringPrimaryElementClass = (
    target: CommonClass,
): target is StringPrimaryElementClass => {
    return isCommonClass(target, StringPrimaryElementClass);
};

export class SoqlPrimaryElementClass extends PrimaryElementClass<'soql', NormalQueryClass> {
    constructor(priamry: NormalQueryClass) {
        super('soql', priamry);
    }
}

export const isSoqlPrimaryElementClass = (
    target: CommonClass,
): target is SoqlPrimaryElementClass => {
    return isCommonClass(target, SoqlPrimaryElementClass);
};

export class TypeRefPrimaryElementClass extends PrimaryElementClass<'typeRef', TypeRefClass> {
    constructor(priamry: TypeRefClass) {
        super('typeRef', priamry);
    }
}

export const isTypeRefPrimaryElementClass = (
    target: CommonClass,
): target is TypeRefPrimaryElementClass => {
    return isCommonClass(target, TypeRefPrimaryElementClass);
};

export class LiteralPrimaryElementClass extends PrimaryElementClass<'literal', NormalLiteralClass> {
    constructor(priamry: NormalLiteralClass) {
        super('literal', priamry);
    }
}

export const isLiteralPrimaryElementClass = (
    target: CommonClass,
): target is LiteralPrimaryElementClass => {
    return isCommonClass(target, LiteralPrimaryElementClass);
};

export class SoslPrimaryElementClass extends PrimaryElementClass<'sosl', SoslLiteralClass> {
    constructor(priamry: SoslLiteralClass) {
        super('sosl', priamry);
    }
}

export const isSoslPrimaryElementClass = (
    target: CommonClass,
): target is SoslPrimaryElementClass => {
    return isCommonClass(target, SoslPrimaryElementClass);
};

export class PrimaryClass extends CommonClass {
    private value:
        | StringPrimaryElementClass
        | SoqlPrimaryElementClass
        | TypeRefPrimaryElementClass
        | LiteralPrimaryElementClass
        | SoslPrimaryElementClass
        | null = null;

    setValue(
        value:
            | StringPrimaryElementClass
            | SoqlPrimaryElementClass
            | TypeRefPrimaryElementClass
            | LiteralPrimaryElementClass
            | SoslPrimaryElementClass
            | null,
    ): void {
        this.value = value;
    }

    getValue():
        | StringPrimaryElementClass
        | SoqlPrimaryElementClass
        | TypeRefPrimaryElementClass
        | LiteralPrimaryElementClass
        | SoslPrimaryElementClass
        | null {
        return this.value;
    }

    copy(commonClass: PrimaryClass) {
        this.setValue(commonClass.getValue());
    }
}

export const isPrimaryClass = (target: any): target is PrimaryClass => {
    return isCommonClass(target, PrimaryClass);
};

export const isPrimaryClassArray = (target: any): target is PrimaryClass[] => {
    return Array.isArray(target) && target.every((t) => isPrimaryClass(t));
};

export const primaryConvert = (
    target: PrimaryTypeClass<unknown>,
    errorClass: ErrorTypeClass[],
): PrimaryClass => {
    const primary: PrimaryClass = new PrimaryClass();

    if (isNormalPrimaryType(target)) {
        primary.setValue(
            new StringPrimaryElementClass('normal', normalPrimaryConvert(target, errorClass)),
        );
    }
    if (isThisPrimaryType(target)) {
        primary.setValue(
            new StringPrimaryElementClass('this', thisPrimaryConvert(target, errorClass)),
        );
    }
    if (isVoidPrimaryType(target)) {
        primary.setValue(
            new StringPrimaryElementClass('void', voidPrimaryConvert(target, errorClass)),
        );
    }
    if (isSoqlPrimaryType(target)) {
        primary.setValue(new SoqlPrimaryElementClass(soqlPrimaryConvert(target, errorClass)));
    }
    if (isSuperPrimaryType(target)) {
        primary.setValue(
            new StringPrimaryElementClass('super', superPrimaryConvert(target, errorClass)),
        );
    }
    if (isTypeRefPrimaryType(target)) {
        primary.setValue(new TypeRefPrimaryElementClass(typeRefPrimaryConvert(target, errorClass)));
    }
    if (isIdPrimaryType(target)) {
        primary.setValue(new StringPrimaryElementClass('id', idPrimaryConvert(target, errorClass)));
    }
    if (isLiteralPrimaryType(target)) {
        primary.setValue(new LiteralPrimaryElementClass(literalPrimaryConvert(target, errorClass)));
    }
    if (isSoslPrimaryType(target)) {
        primary.setValue(new SoslPrimaryElementClass(soslPrimaryConvert(target, errorClass)));
    }

    return primary;
};
