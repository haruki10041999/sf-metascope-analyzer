import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

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
> extends CommonTypeClass<TName> {
    private operator: string;
    private value: T | ErrorTypeClass;

    constructor(type: TName, value: T | ErrorTypeClass, operator: string) {
        super(type);
        this.value = value;
        this.operator = operator;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }

    getOperator(): string {
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
    | ExpressionTypeClass<string, unknown>
    | ExpressionListBaseTypeClass<string, unknown>
    | SingleOperatorExpressionTypeClass<string, unknown>
    | DoubleOperatorExpressionTypeClass<string, unknown, unknown, unknown>
    | ConditionExpressionTypeClass<string, unknown, unknown, unknown>;

export const isExpressionTypeAll = (
    target: CommonTypeClass<string>,
): target is ExpressionAllTypeClass => {
    return (
        target instanceof ExpressionTypeClass ||
        target instanceof ExpressionListBaseTypeClass ||
        target instanceof SingleOperatorExpressionTypeClass ||
        target instanceof DoubleOperatorExpressionTypeClass ||
        target instanceof ConditionExpressionTypeClass
    );
};
