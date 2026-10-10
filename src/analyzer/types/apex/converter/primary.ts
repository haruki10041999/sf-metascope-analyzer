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

import { toPrimitiveValue, toTypeClass } from './commons';
import { normalIdConvert } from './id';
import { TypeRef, typeRefConvert } from './type';
import { NormalQuery } from './query';
import {
    NormalLiteral,
    normalLiteralConvert,
    soqlLiteralConvert,
    SoslLiteral,
    soslLiteralConvert,
} from './literal';

export const normalPrimaryConvert = (
    target: NormalPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const thisPrimaryConvert = (
    target: ThisPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const voidPrimaryConvert = (
    target: VoidPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const soqlPrimaryConvert = (
    target: SoqlPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQuery => {
    const soqlPrimary: NormalQuery = {
        value: [],
        from: [],
        forClause: [],
        whereClause: {
            value: [],
        },
        orderByClause: [],
        updateList: [],
        withClause: {
            field: [],
        },
        groupByClause: {
            value: [],
            having: {
                value: [],
            },
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isSoqlLiteralType, errorClass);
    if (valueTypeClass) {
        const normalQuery = soqlLiteralConvert(valueTypeClass, errorClass);

        soqlPrimary.value.push(...normalQuery.value);
        soqlPrimary.from.push(...normalQuery.from);
        soqlPrimary.forClause.push(...normalQuery.forClause);
        soqlPrimary.orderByClause.push(...normalQuery.orderByClause);
        soqlPrimary.updateList.push(...normalQuery.updateList);
        soqlPrimary.whereClause.value.push(...normalQuery.whereClause.value);
        soqlPrimary.withClause.field.push(...normalQuery.withClause.field);
        soqlPrimary.groupByClause.value.push(...normalQuery.groupByClause.value);
        soqlPrimary.groupByClause.having.value.push(...normalQuery.groupByClause.having.value);

        if (normalQuery.limitClause) {
            soqlPrimary.limitClause = normalQuery.limitClause;
        }
        if (normalQuery.usingScope) {
            soqlPrimary.usingScope = normalQuery.usingScope;
        }
        if (normalQuery.offsetClause) {
            soqlPrimary.offsetClause = normalQuery.offsetClause;
        }
        if (normalQuery.allRowsClause) {
            soqlPrimary.allRowsClause = normalQuery.allRowsClause;
        }
        if (normalQuery.whereClause.operator) {
            soqlPrimary.whereClause.operator = normalQuery.whereClause.operator;
        }
        if (normalQuery.withClause.value) {
            soqlPrimary.withClause.value = normalQuery.withClause.value;
        }

        if (normalQuery.groupByClause.mode) {
            soqlPrimary.groupByClause.mode = normalQuery.groupByClause.mode;
        }

        if (normalQuery.groupByClause.having.operator) {
            soqlPrimary.groupByClause.having.operator = normalQuery.groupByClause.having.operator;
        }
    }

    return soqlPrimary;
};

export const superPrimaryConvert = (
    target: SuperPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
};

export const typeRefPrimaryConvert = (
    target: TypeRefPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRef => {
    const typeRefPrimary: TypeRef = {
        value: [],
    };

    const typeClass = toTypeClass(target.getValue(), isTypeRefType, errorClass);
    if (typeClass) {
        const typeRef = typeRefConvert(typeClass, errorClass);

        typeRefPrimary.value.push(...typeRef.value);

        if (typeRef.dimension) {
            typeRefPrimary.dimension = typeRef.dimension;
        }
    }

    return typeRefPrimary;
};

export const idPrimaryConvert = (
    target: IdPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): string | undefined => {
    const normalIdType = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    if (normalIdType) {
        return normalIdConvert(normalIdType);
    }
    return undefined;
};

export const literalPrimaryConvert = (
    target: LiteralPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteral | undefined => {
    const typeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (typeClass) {
        return normalLiteralConvert(typeClass, errorClass);
    }

    return undefined;
};

export const soslPrimaryConvert = (
    target: SoslPrimaryTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteral => {
    const soslPrimary: SoslLiteral = {
        soslClauses: {
            fieldSpecList: [],
            withList: [],
            updateList: [],
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isSoslLiteralType, errorClass);
    if (valueTypeClass) {
        const soslLiteral = soslLiteralConvert(valueTypeClass, errorClass);

        soslPrimary.soslClauses.fieldSpecList.push(...soslLiteral.soslClauses.fieldSpecList);
        soslPrimary.soslClauses.withList.push(...soslLiteral.soslClauses.withList);
        soslPrimary.soslClauses.updateList.push(...soslLiteral.soslClauses.updateList);

        if (soslLiteral.value) {
            soslPrimary.value = soslLiteral.value;
        }

        if (soslLiteral.soslClauses.value) {
            soslPrimary.soslClauses.value = soslLiteral.soslClauses.value;
        }
        if (soslLiteral.soslClauses.limitClause) {
            soslPrimary.soslClauses.limitClause = soslLiteral.soslClauses.limitClause;
        }
    }
    return soslPrimary;
};

export type Primary =
    | {
          type: 'normal' | 'this' | 'void' | 'super' | 'id';
          primary?: string;
      }
    | {
          type: 'soql';
          primary: NormalQuery;
      }
    | {
          type: 'typeRef';
          primary: TypeRef;
      }
    | {
          type: 'literal';
          primary?: NormalLiteral;
      }
    | {
          type: 'sosl';
          primary: SoslLiteral;
      };

export const primaryConvert = (
    target: PrimaryTypeClass<unknown>,
    errorClass: ErrorTypeClass[],
): Primary | undefined => {
    let primary: Primary | undefined = undefined;

    if (isNormalPrimaryType(target)) {
        primary = { type: 'normal' };

        const convertValue = normalPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isThisPrimaryType(target)) {
        primary = { type: 'this' };

        const convertValue = thisPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isVoidPrimaryType(target)) {
        primary = { type: 'void' };

        const convertValue = voidPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isSoqlPrimaryType(target)) {
        const convertValue = soqlPrimaryConvert(target, errorClass);
        primary = {
            type: 'soql',
            primary: convertValue,
        };
    }
    if (isSuperPrimaryType(target)) {
        primary = { type: 'super' };

        const convertValue = superPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isTypeRefPrimaryType(target)) {
        const convertValue = typeRefPrimaryConvert(target, errorClass);
        primary = {
            type: 'typeRef',
            primary: convertValue,
        };
    }
    if (isIdPrimaryType(target)) {
        primary = { type: 'id' };

        const convertValue = idPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isLiteralPrimaryType(target)) {
        primary = { type: 'literal' };

        const convertValue = literalPrimaryConvert(target, errorClass);
        if (convertValue) {
            primary.primary = convertValue;
        }
    }
    if (isSoslPrimaryType(target)) {
        const convertValue = soslPrimaryConvert(target, errorClass);
        primary = {
            type: 'sosl',
            primary: convertValue,
        };
    }

    return primary;
};
