import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class ExpressionValueTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T;

    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class ExpressionTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;

    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class ExpressionListBaseTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];

    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export class SingleOperatorExpressionTypeClass<
    TName extends string,
    T,
    TOperator extends string,
> extends CommonTypeClass<TName> {
    private operator: TOperator;
    private value: T | ErrorTypeClass;

    constructor(type: TName, value: T | ErrorTypeClass, operator: TOperator) {
        super(type);
        this.value = value;
        this.operator = operator;
    }

    getValue(): T | ErrorTypeClass {
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
> extends CommonTypeClass<TName> {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;
    private operator: TOperator;

    constructor(
        type: TName,
        left: Tleft | ErrorTypeClass,
        right: Tright | ErrorTypeClass,
        operator: TOperator,
    ) {
        super(type);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    getLeft(): Tleft | ErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ErrorTypeClass {
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
> extends CommonTypeClass<TName> {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;
    private operator: TOperator | ErrorTypeClass;

    constructor(
        type: TName,
        left: Tleft | ErrorTypeClass,
        right: Tright | ErrorTypeClass,
        operator: TOperator | ErrorTypeClass,
    ) {
        super(type);
        this.left = left;
        this.right = right;
        this.operator = operator;
    }

    getLeft(): Tleft | ErrorTypeClass {
        return this.left;
    }

    getRight(): Tright | ErrorTypeClass {
        return this.right;
    }

    getOperator(): TOperator | ErrorTypeClass {
        return this.operator;
    }
}

export class ConditionExpressionTypeClass<
    TName extends string,
    TCondition,
    TTrue,
    TFalse,
> extends CommonTypeClass<TName> {
    private condition: TCondition | ErrorTypeClass;
    private trueValue: TTrue | ErrorTypeClass;
    private falseValue: TFalse | ErrorTypeClass;

    constructor(
        type: TName,
        condition: TCondition | ErrorTypeClass,
        trueValue: TTrue | ErrorTypeClass,
        falseValue: TFalse | ErrorTypeClass,
    ) {
        super(type);
        this.condition = condition;
        this.trueValue = trueValue;
        this.falseValue = falseValue;
    }

    getCondition(): TCondition | ErrorTypeClass {
        return this.condition;
    }

    getTrueValue(): TTrue | ErrorTypeClass {
        return this.trueValue;
    }

    getFalseValue(): TFalse | ErrorTypeClass {
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
    target: CommonTypeClass<string>,
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
