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

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { qualifiedNameConvert } from './name';
import { ExpressionClass, boundExpressionConvert } from './expression';
import { NormalQueryClass, normalQueryConvert } from './query';
import { SoslClausesClass, soslClausesConvert } from './clause';

export class NormalLiteralClass extends CommonClass {
    private value: string | null = null;
    private valueType: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    copy(commonClass: NormalLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isNormalLiteralClass = (target: CommonClass): target is NormalLiteralClass => {
    return target instanceof NormalLiteralClass;
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

export class WhenLiteralClass extends CommonClass {
    private value: string | string[] | null = null;
    private valueType: string | null = null;
    private operator: string | null = null;

    setValue(value: string | string[] | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): string | string[] | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: WhenLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setOperator(commonClass.getOperator());
    }
}

export const isWhenLiteralClass = (target: CommonClass): target is WhenLiteralClass => {
    return target instanceof WhenLiteralClass;
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

export class SoslLiteralClass extends CommonClass {
    private value: string | Expression | null = null;
    private soslClauses: SoslClauses | null = null;

    setValue(value: string | Expression | null) {
        this.value = value;
    }

    setSoslClauses(soslClauses: SoslClauses | null): void {
        this.soslClauses = soslClauses;
    }

    getValue(): string | Expression | null {
        return this.value;
    }

    getSoslClauses(): SoslClauses | null {
        return this.soslClauses;
    }

    copy(commonClass: SoslLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setSoslClauses(commonClass.getSoslClauses());
    }
}

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

export class SoslLiteralAltClass extends CommonClass {
    private value: string | null = null;
    private soslClauses: SoslClauses | null = null;

    setValue(value: string | null) {
        this.value = value;
    }

    setSoslClauses(soslClauses: SoslClauses | null): void {
        this.soslClauses = soslClauses;
    }

    getValue(): string | null {
        return this.value;
    }

    getSoslClauses(): SoslClauses | null {
        return this.soslClauses;
    }

    copy(commonClass: SoslLiteralAltClass): void {
        this.setValue(commonClass.getValue());
        this.setSoslClauses(commonClass.getSoslClauses());
    }
}

export const isSoslLiteralAltClass = (target: CommonClass): target is SoslLiteralAltClass => {
    return target instanceof SoslLiteralAltClass;
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

export class SignedLiteralClass extends CommonClass {
    private value: string | null = null;
    private valueType: string | null = null;
    private operator: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: SignedLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setOperator(commonClass.getOperator());
    }
}

export const isSignedLiteralClass = (target: CommonClass): target is SignedLiteralClass => {
    return target instanceof SignedLiteralClass;
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
