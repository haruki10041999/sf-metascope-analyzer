import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalLiteralTypeClass,
    WhenLiteralTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralTypeClass,
    SoslLiteralAltTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    isQualifiedNameType,
    isNormalQueryType,
    isBoundExpressionType,
    isSoslClausesType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { qualifiedNameConvert } from './name';
import { Expression, boundExpressionConvert } from './expression';
import { NormalQuery, normalQueryConvert } from './query';
import { SoslClauses, soslClausesConvert } from './clause';

export type NormalLiteral = {
    value?: string;
    valueType: string;
};

export const normalLiteralConvert = (
    target: NormalLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteral => {
    const normalLiteral: NormalLiteral = {
        valueType: target.getValueType(),
    };

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        normalLiteral.value = value;
    }

    return normalLiteral;
};

export type WhenLiteral = {
    value?: string | string[];
    valueType: string;
    operator?: string;
};

export const whenLiteralConvert = (
    target: WhenLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): WhenLiteral => {
    const whenLiteral: WhenLiteral = {
        valueType: target.getValueType(),
    };

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        whenLiteral.value = valueTypeClass;
    } else {
        const nameTypeClass = toTypeClass(valueTypeClass, isQualifiedNameType, errorClass);
        if (nameTypeClass) {
            whenLiteral.value = qualifiedNameConvert(nameTypeClass, errorClass);
        }
    }

    const operator = target.getOperator();
    if (operator) {
        whenLiteral.operator = operator;
    }

    return whenLiteral;
};

export const soqlLiteralConvert = (
    target: SoqlLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQuery => {
    const soqlLiteral: NormalQuery = {
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

    const valueTypeClass = toTypeClass(target.getValue(), isNormalQueryType, errorClass);
    if (valueTypeClass) {
        const normalQuery = normalQueryConvert(valueTypeClass, errorClass);

        soqlLiteral.value.push(...normalQuery.value);
        soqlLiteral.from.push(...normalQuery.from);
        soqlLiteral.forClause.push(...normalQuery.forClause);
        soqlLiteral.orderByClause.push(...normalQuery.orderByClause);
        soqlLiteral.updateList.push(...normalQuery.updateList);
        soqlLiteral.whereClause.value.push(...normalQuery.whereClause.value);
        soqlLiteral.withClause.field.push(...normalQuery.withClause.field);
        soqlLiteral.groupByClause.value.push(...normalQuery.groupByClause.value);
        soqlLiteral.groupByClause.having.value.push(...normalQuery.groupByClause.having.value);

        if (normalQuery.limitClause) {
            soqlLiteral.limitClause = normalQuery.limitClause;
        }
        if (normalQuery.usingScope) {
            soqlLiteral.usingScope = normalQuery.usingScope;
        }
        if (normalQuery.offsetClause) {
            soqlLiteral.offsetClause = normalQuery.offsetClause;
        }
        if (normalQuery.allRowsClause) {
            soqlLiteral.allRowsClause = normalQuery.allRowsClause;
        }
        if (normalQuery.whereClause.operator) {
            soqlLiteral.whereClause.operator = normalQuery.whereClause.operator;
        }
        if (normalQuery.withClause.value) {
            soqlLiteral.withClause.value = normalQuery.withClause.value;
        }

        if (normalQuery.groupByClause.mode) {
            soqlLiteral.groupByClause.mode = normalQuery.groupByClause.mode;
        }

        if (normalQuery.groupByClause.having.operator) {
            soqlLiteral.groupByClause.having.operator = normalQuery.groupByClause.having.operator;
        }
    }

    return soqlLiteral;
};

export type SoslLiteral = {
    value?: string | Expression;
    soslClauses: SoslClauses;
};

export const soslLiteralConvert = (
    target: SoslLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteral => {
    const soslLiteral: SoslLiteral = {
        soslClauses: {
            fieldSpecList: [],
            withList: [],
            updateList: [],
        },
    };

    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );
    if (soslClausesTypeClass) {
        const soslClauses = soslClausesConvert(soslClausesTypeClass, errorClass);

        soslLiteral.soslClauses.fieldSpecList.push(...soslClauses.fieldSpecList);
        soslLiteral.soslClauses.withList.push(...soslClauses.withList);
        soslLiteral.soslClauses.updateList.push(...soslClauses.updateList);

        if (soslClauses.value) {
            soslLiteral.soslClauses.value = soslClauses.value;
        }
        if (soslClauses.limitClause) {
            soslLiteral.soslClauses.limitClause = soslClauses.limitClause;
        }
    }

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        soslLiteral.value = valueTypeClass;
    } else {
        const typeClass = toTypeClass(valueTypeClass, isBoundExpressionType, errorClass);
        if (typeClass) {
            const expression = boundExpressionConvert(typeClass, errorClass);
            if (expression) {
                soslLiteral.value = expression;
            }
        }
    }

    return soslLiteral;
};

export type SoslLiteralAlt = {
    value?: string;
    soslClauses: SoslClauses;
};

export const soslLiteralAltConvert = (
    target: SoslLiteralAltTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralAlt => {
    const soslLiteralAlt: SoslLiteralAlt = {
        soslClauses: {
            fieldSpecList: [],
            withList: [],
            updateList: [],
        },
    };

    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );
    if (soslClausesTypeClass) {
        const soslClauses = soslClausesConvert(soslClausesTypeClass, errorClass);

        soslLiteralAlt.soslClauses.fieldSpecList.push(...soslClauses.fieldSpecList);
        soslLiteralAlt.soslClauses.withList.push(...soslClauses.withList);
        soslLiteralAlt.soslClauses.updateList.push(...soslClauses.updateList);

        if (soslClauses.value) {
            soslLiteralAlt.soslClauses.value = soslClauses.value;
        }
        if (soslClauses.limitClause) {
            soslLiteralAlt.soslClauses.limitClause = soslClauses.limitClause;
        }
    }

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        soslLiteralAlt.value = value;
    }

    return soslLiteralAlt;
};

export type SignedLiteral = {
    value?: string;
    valueType: string;
    operator?: string;
};

export const signedIntegerConvert = (
    target: SignedIntegerTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteral => {
    const signedInteger: SignedLiteral = {
        valueType: target.getValueType(),
    };

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        signedInteger.value = value;
    }

    const operator = target.getOperator();
    if (operator) {
        signedInteger.operator = operator;
    }

    return signedInteger;
};

export const signedNumberConvert = (
    target: SignedNumberTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteral => {
    const signedNumber: SignedLiteral = {
        valueType: target.getValueType(),
    };

    const value = toPrimitiveValue(
        target.getValue(),
        (target): target is string => typeof target === 'string',
        errorClass,
    );
    if (value) {
        signedNumber.value = value;
    }

    const operator = target.getOperator();
    if (operator) {
        signedNumber.operator = operator;
    }

    return signedNumber;
};
