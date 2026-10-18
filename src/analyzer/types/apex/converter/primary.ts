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
    NormalIdTypeClass,
} from '../../apex_IR';

import {
    toPrimitiveValue,
    SourceSpanInfo,
    CommonBaseClass,
    ElementBaseClass,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
    assignClassToElementClass,
    assignClass,
    isTargetTypeClass,
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

export const isPrimaryClass = (target: unknown): target is PrimaryClass => {
    return target instanceof PrimaryClass;
};

class PrimaryClass extends CommonBaseClass<'primary', PrimaryJson> {
    private primary: string | null;

    constructor(target: NormalPrimaryTypeClass) {
        const primary = toPrimitiveValue(target.getValue(), isString);
        super('primary', target.getSpan()!, isErrorInfo(primary) ? primary : null);
        this.primary = !isErrorInfo(primary) ? primary : null;
    }

    toJson(): PrimaryJson {
        return {
            type: 'primary',
            primary: this.primary,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type ThisPrimaryJson = CommonJson<'thisPrimary'> & {
    thisPrimary: string | null;
};
export const isThisPrimaryJson = typia.createIs<ThisPrimaryJson>();

export const isThisPrimaryClass = (target: unknown): target is ThisPrimaryClass => {
    return target instanceof ThisPrimaryClass;
};

class ThisPrimaryClass extends CommonBaseClass<'thisPrimary', ThisPrimaryJson> {
    private thisPrimary: string | null;

    constructor(target: NormalPrimaryTypeClass) {
        const thisPrimary = toPrimitiveValue(target.getValue(), isString);
        super('thisPrimary', target.getSpan()!, isErrorInfo(thisPrimary) ? thisPrimary : null);
        this.thisPrimary = !isErrorInfo(thisPrimary) ? thisPrimary : null;
    }

    toJson(): ThisPrimaryJson {
        return {
            type: 'thisPrimary',
            thisPrimary: this.thisPrimary,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type VoidPrimaryJson = CommonJson<'voidPrimary'> & {
    voidPrimary: string | null;
};
export const isVoidPrimaryJson = typia.createIs<VoidPrimaryJson>();

export const isVoidPrimaryClass = (target: unknown): target is VoidPrimaryClass => {
    return target instanceof VoidPrimaryClass;
};

class VoidPrimaryClass extends CommonBaseClass<'voidPrimary', VoidPrimaryJson> {
    private voidPrimary: string | null;

    constructor(target: NormalPrimaryTypeClass) {
        const voidPrimary = toPrimitiveValue(target.getValue(), isString);
        super('voidPrimary', target.getSpan()!, isErrorInfo(voidPrimary) ? voidPrimary : null);
        this.voidPrimary = !isErrorInfo(voidPrimary) ? voidPrimary : null;
    }

    toJson(): VoidPrimaryJson {
        return {
            type: 'voidPrimary',
            voidPrimary: this.voidPrimary,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type SuperPrimaryJson = CommonJson<'superPrimary'> & {
    superPrimary: string | null;
};
export const isSuperPrimaryJson = typia.createIs<SuperPrimaryJson>();

export const isSuperPrimaryClass = (target: unknown): target is SuperPrimaryClass => {
    return target instanceof SuperPrimaryClass;
};

class SuperPrimaryClass extends CommonBaseClass<'superPrimary', SuperPrimaryJson> {
    private superPrimary: string | null;

    constructor(target: NormalPrimaryTypeClass) {
        const superPrimary = toPrimitiveValue(target.getValue(), isString);
        super('superPrimary', target.getSpan()!, isErrorInfo(superPrimary) ? superPrimary : null);
        this.superPrimary = !isErrorInfo(superPrimary) ? superPrimary : null;
    }

    toJson(): SuperPrimaryJson {
        return {
            type: 'superPrimary',
            superPrimary: this.superPrimary,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type IdPrimaryJson = CommonJson<'idPrimary'> & {
    idPrimary: Omit<IdJson, 'sourceSpan'> | null;
};
export const isIdPrimaryJson = typia.createIs<IdPrimaryJson>();

export const isIdPrimaryClass = (target: unknown): target is IdPrimaryClass => {
    return target instanceof IdPrimaryClass;
};

class IdPrimaryClass extends CommonBaseClass<'idPrimary', IdPrimaryJson> {
    private idPrimary: IdClass | null;

    constructor(target: IdPrimaryTypeClass) {
        const id = assignClass(
            target.getValue(),
            (target: unknown): target is NormalIdTypeClass =>
                isTargetTypeClass(target, isNormalIdType),
            (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
        );
        super(
            'idPrimary',
            isErrorInfo(id) ? target.getSpan()! : { [id.getType()]: id.getSourceSpan() },
            isErrorInfo(id) ? id : null,
        );
        this.idPrimary = !isErrorInfo(id) ? id : null;
    }

    toJson(): IdPrimaryJson {
        if (this.idPrimary) {
            const { sourceSpan, ...id } = this.idPrimary.toJson();
            return {
                type: 'idPrimary',
                idPrimary: id,
                sourceSpan: this.getSourceSpan(),
            };
        } else {
            return {
                type: 'idPrimary',
                idPrimary: null,
                sourceSpan: this.getSourceSpan(),
            };
        }
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

export const primaryRules = [
    {
        isValid: (target: unknown): target is NormalPrimaryTypeClass =>
            isTargetTypeClass(target, isNormalPrimaryType),
        construct: (target: NormalPrimaryTypeClass) => new PrimaryClass(target),
    },
    {
        isValid: (target: unknown): target is VoidPrimaryTypeClass =>
            isTargetTypeClass(target, isVoidPrimaryType),
        construct: (target: VoidPrimaryTypeClass) => new VoidPrimaryClass(target),
    },
    {
        isValid: (target: unknown): target is SuperPrimaryTypeClass =>
            isTargetTypeClass(target, isSuperPrimaryType),
        construct: (target: SuperPrimaryTypeClass) => new SuperPrimaryClass(target),
    },
    {
        isValid: (target: unknown): target is ThisPrimaryTypeClass =>
            isTargetTypeClass(target, isThisPrimaryType),
        construct: (target: ThisPrimaryTypeClass) => new ThisPrimaryClass(target),
    },
    {
        isValid: (target: unknown): target is IdPrimaryTypeClass =>
            isTargetTypeClass(target, isIdPrimaryType),
        construct: (target: IdPrimaryTypeClass) => new IdPrimaryClass(target),
    },
] as const;

export class PrimaryElementClass extends ElementBaseClass<
    [
        | NormalPrimaryTypeClass
        | ThisPrimaryTypeClass
        | VoidPrimaryTypeClass
        | IdPrimaryTypeClass
        | SuperPrimaryTypeClass,
    ],
    typeof primaryRules
> {}

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
        target instanceof CommonTypeClass &&
        (isNormalPrimaryType(target) ||
            isThisPrimaryType(target) ||
            isVoidPrimaryType(target) ||
            isIdPrimaryType(target) ||
            isSuperPrimaryType(target))
        // isSoslPrimaryType(target) ||
        // isLiteralPrimaryType(target) ||
        // isTypeRefPrimaryType(target) ||
        // isSoqlPrimaryType(target)
    );
};

export const isAllPrimaryClass = (target: unknown): target is AllPrimaryClass => {
    return (
        isPrimaryClass(target) ||
        isVoidPrimaryClass(target) ||
        isSuperPrimaryClass(target) ||
        isThisPrimaryClass(target) ||
        isIdPrimaryClass(target)
    );
};
