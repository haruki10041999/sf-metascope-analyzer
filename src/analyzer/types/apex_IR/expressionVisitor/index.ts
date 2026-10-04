import {
    ArrayExpressionContext,
    Arth1ExpressionContext,
    Arth2ExpressionContext,
    AssignExpressionContext,
    BitAndExpressionContext,
    BitExpressionContext,
    BitNotExpressionContext,
    BitOrExpressionContext,
    CastExpressionContext,
    CmpExpressionContext,
    CoalExpressionContext,
    CondExpressionContext,
    DotExpressionContext,
    EqualityExpressionContext,
    ExpressionContext,
    InstanceOfExpressionContext,
    LogAndExpressionContext,
    LogOrExpressionContext,
    MethodCallExpressionContext,
    NegExpressionContext,
    NewExpressionContext,
    PostOpExpressionContext,
    PreOpExpressionContext,
    PrimaryExpressionContext,
    SubExpressionContext,
    ParExpressionContext,
    BoundExpressionContext,
    FilteringExpressionContext,
    FieldExpressionContext,
    ConditionalExpressionContext,
    LogicalExpressionContext,
    WhereLogicalExpressionContext,
    WhereConditionalExpressionContext,
    WhereFieldExpressionContext,
} from '@apexdevtools/apex-parser';

import { ArrayExpressionTypeClass } from './arrayExpression';
import { Arth1ExpressionTypeClass } from './arth1Expression';
import { Arth2ExpressionTypeClass } from './arth2Expression';
import { AssignExpressionTypeClass } from './assignExpression';
import { BitAndExpressionTypeClass } from './bitAndExpression';
import { BitExpressionTypeClass } from './bitExpression';
import { BitNotExpressionTypeClass } from './bitNotExpression';
import { BitOrExpressionTypeClass } from './bitOrExpression';
import { CastExpressionTypeClass } from './castExpression';
import { CmpExpressionTypeClass } from './cmpExpression';
import { CoalExpressionTypeClass } from './coalExpression';
import { CondExpressionTypeClass } from './condExpression';
import { DotExpressionTypeClass } from './dotExpression';
import { EqualityExpressionTypeClass } from './equalityExpression';
import { InstanceOfExpressionTypeClass } from './instanceOfExpression';
import { LogAndExpressionTypeClass } from './logAndExpression';
import { LogOrExpressionTypeClass } from './logOrExpression';
import { MethodCallExpressionType } from './methodCallExpression';
import { NegExpressionTypeClass } from './negExpression';
import { NewExpressionTypeClass } from './newExpression';
import { NormalExpressionTypeClass } from './normal';
import { PostOpExpressionTypeClass } from './postOpExpression';
import { PreOpExpressionTypeClass } from './preOpExpression';
import { PrimaryExpressionTypeClass } from './primaryExpression';
import { SubExpressionTypeClass } from './subExpression';
import { ParExpressionTypeClass } from './parExpression';
import { BoundExpressionTypeClass } from './boundExpression';
import { FilteringExpressionType, makeFilteringExpressionType } from './filteringExpression';
import { FieldExpressionType, makeFieldExpressionType } from './fieldExpression';
import { ConditionalExpressionTypeClass } from './conditionalExpression';
import { LogicalExpressionType, makeLogicalExpressionType } from './logicalExpression';
import {
    WhereLogicalExpressionType,
    makeWhereLogicalExpressionType,
} from './whereLogicalExpression';
import {
    WhereConditionalExpressionType,
    makeWhereConditionalExpressionType,
} from './whereConditionalExpression';
import { WhereFieldExpressionType, makeWhereFieldExpressionType } from './whereFieldExpression';

import { ErrorTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isArrayExpressionType, ArrayExpressionTypeClass } from './arrayExpression';
export { isArth1ExpressionType, Arth1ExpressionTypeClass } from './arth1Expression';
export { isArth2ExpressionType, Arth2ExpressionTypeClass } from './arth2Expression';
export { isAssignExpressionType, AssignExpressionTypeClass } from './assignExpression';
export { isBitAndExpressionType, BitAndExpressionTypeClass } from './bitAndExpression';
export { isBitExpressionType, BitExpressionTypeClass } from './bitExpression';
export { isBitNotExpressionType, BitNotExpressionTypeClass } from './bitNotExpression';
export { isBitOrExpressionType, BitOrExpressionTypeClass } from './bitOrExpression';
export { isCastExpressionType, CastExpressionTypeClass } from './castExpression';
export { isCmpExpressionType, CmpExpressionTypeClass } from './cmpExpression';
export { isCoalExpressionType, CoalExpressionTypeClass } from './coalExpression';
export { isCondExpressionType, CondExpressionTypeClass } from './condExpression';
export { isDotExpressionType, DotExpressionTypeClass } from './dotExpression';
export { isEqualityExpressionType, EqualityExpressionTypeClass } from './equalityExpression';
export { isInstanceOfExpressionType, InstanceOfExpressionTypeClass } from './instanceOfExpression';
export { isLogAndExpressionType, LogAndExpressionTypeClass } from './logAndExpression';
export { isLogOrExpressionType, LogOrExpressionTypeClass } from './logOrExpression';
export { isMethodCallExpressionType, MethodCallExpressionType } from './methodCallExpression';
export { isNegExpressionType, NegExpressionTypeClass } from './negExpression';
export { isNewExpressionType, NewExpressionTypeClass } from './newExpression';
export { isNormalExpressionType, NormalExpressionTypeClass } from './normal';
export { isPostOpExpressionType, PostOpExpressionTypeClass } from './postOpExpression';
export { isPreOpExpressionType, PreOpExpressionTypeClass } from './preOpExpression';
export { isPrimaryExpressionType, PrimaryExpressionTypeClass } from './primaryExpression';
export { isSubExpressionType, SubExpressionTypeClass } from './subExpression';
export { isBoundExpressionType, BoundExpressionTypeClass } from './boundExpression';
export {
    isConditionalExpressionType,
    ConditionalExpressionTypeClass,
} from './conditionalExpression';
export { isParExpressionType, ParExpressionTypeClass } from './parExpression';

export class ExpressionTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class ExpressionListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export class SingleOperatorExpressionTypeClass<T> extends CommonTypeClass {
    private operator: string;
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass, operator: string) {
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

export class DoubleOperatorExpressionTypeClass<Tleft, Tright> extends CommonTypeClass {
    private left: Tleft | ErrorTypeClass;
    private right: Tright | ErrorTypeClass;
    private operator: string;

    constructor(
        type: string,
        left: Tleft | ErrorTypeClass,
        right: Tright | ErrorTypeClass,
        operator: string,
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

    getOperator(): string {
        return this.operator;
    }
}

export class IfExpressionTypeClass<TCondition, TTrue, TFalse> extends CommonTypeClass {
    private condition: TCondition | ErrorTypeClass;
    private trueValue: TTrue | ErrorTypeClass;
    private falseValue: TFalse | ErrorTypeClass;

    constructor(
        type: string,
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
    | ExpressionTypeClass<unknown>
    | ExpressionListTypeClass<unknown>
    | SingleOperatorExpressionTypeClass<unknown>
    | DoubleOperatorExpressionTypeClass<unknown, unknown>
    | IfExpressionTypeClass<unknown, unknown, unknown>;

export const isExpressionTypeAll = (target: CommonTypeClass): target is ExpressionAllTypeClass => {
    return (
        target instanceof ExpressionTypeClass ||
        target instanceof ExpressionListTypeClass ||
        target instanceof SingleOperatorExpressionTypeClass ||
        target instanceof DoubleOperatorExpressionTypeClass ||
        target instanceof ConditionalExpressionTypeClass
    );
};

export class ExpressionVisitor extends CommonVisitor<ExpressionAllTypeClass> {
    visitExpression(ctx: ExpressionContext) {
        return NormalExpressionTypeClass.create(ctx);
    }

    visitPrimaryExpression(ctx: PrimaryExpressionContext) {
        return PrimaryExpressionTypeClass.create(ctx);
    }

    visitArth1Expression(ctx: Arth1ExpressionContext) {
        return Arth1ExpressionTypeClass.create(ctx);
    }

    visitCoalExpression(ctx: CoalExpressionContext) {
        return CoalExpressionTypeClass.create(ctx);
    }

    visitDotExpression(ctx: DotExpressionContext) {
        return DotExpressionTypeClass.create(ctx);
    }

    visitBitOrExpression(ctx: BitOrExpressionContext) {
        return BitOrExpressionTypeClass.create(ctx);
    }

    visitArrayExpression(ctx: ArrayExpressionContext) {
        return ArrayExpressionTypeClass.create(ctx);
    }

    visitNewExpression(ctx: NewExpressionContext) {
        return NewExpressionTypeClass.create(ctx);
    }

    visitAssignExpression(ctx: AssignExpressionContext) {
        return AssignExpressionTypeClass.create(ctx);
    }

    visitMethodCallExpression(ctx: MethodCallExpressionContext) {
        return MethodCallExpressionType.create(ctx);
    }

    visitBitNotExpression(ctx: BitNotExpressionContext) {
        return BitNotExpressionTypeClass.create(ctx);
    }

    visitArth2Expression(ctx: Arth2ExpressionContext) {
        return Arth2ExpressionTypeClass.create(ctx);
    }

    visitLogAndExpression(ctx: LogAndExpressionContext) {
        return LogAndExpressionTypeClass.create(ctx);
    }

    visitCastExpression(ctx: CastExpressionContext) {
        return CastExpressionTypeClass.create(ctx);
    }

    visitBitAndExpression(ctx: BitAndExpressionContext) {
        return BitAndExpressionTypeClass.create(ctx);
    }

    visitCmpExpression(ctx: CmpExpressionContext) {
        return CmpExpressionTypeClass.create(ctx);
    }

    visitBitExpression(ctx: BitExpressionContext) {
        return BitExpressionTypeClass.create(ctx);
    }

    visitLogOrExpression(ctx: LogOrExpressionContext) {
        return LogOrExpressionTypeClass.create(ctx);
    }

    visitCondExpression(ctx: CondExpressionContext) {
        return CondExpressionTypeClass.create(ctx);
    }

    visitEqualityExpression(ctx: EqualityExpressionContext) {
        return EqualityExpressionTypeClass.create(ctx);
    }

    visitPostOpExpression(ctx: PostOpExpressionContext) {
        return PostOpExpressionTypeClass.create(ctx);
    }

    visitNegExpression(ctx: NegExpressionContext) {
        return NegExpressionTypeClass.create(ctx);
    }

    visitPreOpExpression(ctx: PreOpExpressionContext) {
        return PreOpExpressionTypeClass.create(ctx);
    }

    visitSubExpression(ctx: SubExpressionContext) {
        return SubExpressionTypeClass.create(ctx);
    }

    visitInstanceOfExpression(ctx: InstanceOfExpressionContext) {
        return InstanceOfExpressionTypeClass.create(ctx);
    }

    visitParExpression(ctx: ParExpressionContext) {
        return ParExpressionTypeClass.create(ctx);
    }

    visitBoundExpression(ctx: BoundExpressionContext) {
        return BoundExpressionTypeClass.create(ctx);
    }

    visitFilteringExpression(ctx: FilteringExpressionContext) {
        console.log('解析を開始します。' + 'FilteringExpressionContext:  ' + ctx.getText());
        const result = makeFilteringExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FilteringExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldExpression(ctx: FieldExpressionContext) {
        console.log('解析を開始します。' + 'FieldExpressionContext:  ' + ctx.getText());
        const result = makeFieldExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitConditionalExpression(ctx: ConditionalExpressionContext) {
        return ConditionalExpressionTypeClass.create(ctx);
    }

    visitLogicalExpression(ctx: LogicalExpressionContext) {
        console.log('解析を開始します。' + 'LogicalExpressionContext:  ' + ctx.getText());
        const result = makeLogicalExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LogicalExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhereLogicalExpression(ctx: WhereLogicalExpressionContext) {
        console.log('解析を開始します。' + 'WhereLogicalExpressionContext:  ' + ctx.getText());
        const result = makeWhereLogicalExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhereLogicalExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhereConditionalExpression(ctx: WhereConditionalExpressionContext) {
        console.log('解析を開始します。' + 'WhereConditionalExpressionContext:  ' + ctx.getText());
        const result = makeWhereConditionalExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhereConditionalExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhereFieldExpression(ctx: WhereFieldExpressionContext) {
        console.log('解析を開始します。' + 'WhereFieldExpressionContext:  ' + ctx.getText());
        const result = makeWhereFieldExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhereFieldExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
