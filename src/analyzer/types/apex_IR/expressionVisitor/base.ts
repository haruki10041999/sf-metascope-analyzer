import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class ExpressionValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class ExpressionTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;

    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class ExpressionListBaseTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];

    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export class SingleOperatorExpressionTypeClass<
    TName extends string,
    T,
    TOperator extends string,
> extends ApexCommonTypeClass<TName> {
    private operator: TOperator;
    private value: T | ApexErrorTypeClass;

    constructor(type: TName, value: T | ApexErrorTypeClass, operator: TOperator) {
        super(type);
        this.value = value;
        this.operator = operator;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }

    getOperator(): TOperator {
        return this.operator;
    }
}

export class DoubleStringOperatorExpressionTypeClass<
    TName extends string,
    Tleft,
    TOperator extends string,
    Tright,
> extends ApexCommonTypeClass<TName> {
    private left: Tleft | ApexErrorTypeClass;
    private right: Tright | ApexErrorTypeClass;
    private operator: TOperator;

    constructor(
        type: TName,
        left: Tleft | ApexErrorTypeClass,
        right: Tright | ApexErrorTypeClass,
        operator: TOperator,
    ) {
        super(type);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    getLeft(): Tleft | ApexErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ApexErrorTypeClass {
        return this.right;
    }

    getOperator(): TOperator {
        return this.operator;
    }
}

export class DoubleOperatorExpressionTypeClass<
    TName extends string,
    Tleft,
    TOperator,
    Tright,
> extends ApexCommonTypeClass<TName> {
    private left: Tleft | ApexErrorTypeClass;
    private right: Tright | ApexErrorTypeClass;
    private operator: TOperator | ApexErrorTypeClass;

    constructor(
        type: TName,
        left: Tleft | ApexErrorTypeClass,
        right: Tright | ApexErrorTypeClass,
        operator: TOperator | ApexErrorTypeClass,
    ) {
        super(type);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    getLeft(): Tleft | ApexErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ApexErrorTypeClass {
        return this.right;
    }

    getOperator(): TOperator | ApexErrorTypeClass {
        return this.operator;
    }
}

export class ConditionExpressionTypeClass<
    TName extends string,
    TCondition,
    TTrue,
    TFalse,
> extends ApexCommonTypeClass<TName> {
    private condition: TCondition | ApexErrorTypeClass;
    private trueValue: TTrue | ApexErrorTypeClass;
    private falseValue: TFalse | ApexErrorTypeClass;

    constructor(
        type: TName,
        condition: TCondition | ApexErrorTypeClass,
        trueValue: TTrue | ApexErrorTypeClass,
        falseValue: TFalse | ApexErrorTypeClass,
    ) {
        super(type);
        this.condition = condition;
        this.trueValue = trueValue;
        this.falseValue = falseValue;
    }

    getCondition(): TCondition | ApexErrorTypeClass {
        return this.condition;
    }

    getTrueValue(): TTrue | ApexErrorTypeClass {
        return this.trueValue;
    }

    getFalseValue(): TFalse | ApexErrorTypeClass {
        return this.falseValue;
    }
}

export type ExpressionAllTypeClass =
    | ExpressionValueTypeClass<string, unknown>
    | ExpressionTypeClass<string, unknown>
    | ExpressionListBaseTypeClass<string, unknown>
    | SingleOperatorExpressionTypeClass<string, unknown, string>
    | DoubleStringOperatorExpressionTypeClass<string, unknown, string, unknown>
    | DoubleOperatorExpressionTypeClass<string, unknown, unknown, unknown>
    | ConditionExpressionTypeClass<string, unknown, unknown, unknown>;

export const isExpressionTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is ExpressionAllTypeClass => {
    return (
        target instanceof ExpressionValueTypeClass ||
        target instanceof ExpressionTypeClass ||
        target instanceof ExpressionListBaseTypeClass ||
        target instanceof SingleOperatorExpressionTypeClass ||
        target instanceof DoubleStringOperatorExpressionTypeClass ||
        target instanceof DoubleOperatorExpressionTypeClass ||
        target instanceof ConditionExpressionTypeClass
    );
};
