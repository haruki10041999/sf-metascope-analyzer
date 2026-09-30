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
import { CastExpressionType, makeCastExpressionType } from './castExpression';
import { CmpExpressionTypeClass } from './cmpExpression';
import { CoalExpressionTypeClass } from './coalExpression';
import { CondExpressionType, makeCondExpressionType } from './condExpression';
import { DotExpressionType, makeDotExpressionType } from './dotExpression';
import { EqualityExpressionTypeClass } from './equalityExpression';
import { InstanceOfExpressionType, makeInstanceOfExpressionType } from './instanceOfExpression';
import { LogAndExpressionTypeClass } from './logAndExpression';
import { LogOrExpressionTypeClass } from './logOrExpression';
import { MethodCallExpressionType, makeMethodCallExpressionType } from './methodCallExpression';
import { NegExpressionTypeClass } from './negExpression';
import { NewExpressionType, makeNewExpressionType } from './newExpression';
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

import { ErrorTypeClass, ContextTypeClass, CommonVisitor, CommonTypeClass } from '../commonVisitor';

export { isArrayExpressionType, ArrayExpressionTypeClass } from './arrayExpression';
export { isArth1ExpressionType, Arth1ExpressionTypeClass } from './arth1Expression';
export { isArth2ExpressionType, Arth2ExpressionTypeClass } from './arth2Expression';
export { isAssignExpressionType, AssignExpressionTypeClass } from './assignExpression';
export { isBitAndExpressionType, BitAndExpressionTypeClass } from './bitAndExpression';
export { isBitExpressionType, BitExpressionTypeClass } from './bitExpression';
export { isBitNotExpressionType, BitNotExpressionTypeClass } from './bitNotExpression';
export { isBitOrExpressionType, BitOrExpressionTypeClass } from './bitOrExpression';
export { isCmpExpressionType, CmpExpressionTypeClass } from './cmpExpression';
export { isCoalExpressionType, CoalExpressionTypeClass } from './coalExpression';
export { isEqualityExpressionType, EqualityExpressionTypeClass } from './equalityExpression';
export { isLogAndExpressionType, LogAndExpressionTypeClass } from './logAndExpression';
export { isLogOrExpressionType, LogOrExpressionTypeClass } from './logOrExpression';
export { isNegExpressionType, NegExpressionTypeClass } from './negExpression';
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

export class ExpressionTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export class SingleOperatorExpressionTypeClass<T> extends ExpressionTypeClass<T> {
    private operator: string | null = null;

    constructor(
        type: string,
        value: T | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, value, errorClasses);
        this.operator = operator;
    }

    getOperator(): string | null {
        return this.operator;
    }

    isOperatorNull(): boolean {
        return this.operator === null;
    }
}

export class DoubleOperatorExpressionTypeClass<
    Tleft,
    Tright,
> extends SingleOperatorExpressionTypeClass<{ left: Tleft; right: Tright }> {
    private left: Tleft | null = null;
    private right: Tright | null = null;

    constructor(
        type: string,
        left: any | null,
        right: any | null,
        operator: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super(type, { left: left, right: right }, operator, errorClasses);
    }

    getLeft(): Tleft | null {
        return this.left;
    }

    getRight(): Tright | null {
        return this.right;
    }

    isLeftNull(): boolean {
        return this.left === null;
    }

    isRightNull(): boolean {
        return this.right === null;
    }
}

export const isExpressionTypeAll = (
    target: CommonTypeClass,
): target is ExpressionTypeClass<unknown> => {
    return target instanceof ExpressionTypeClass;
};

export class ExpressionVisitor extends CommonVisitor<ExpressionTypeClass<unknown>> {
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
        console.log('解析を開始します。' + 'DotExpressionContext:  ' + ctx.getText());
        const result = makeDotExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DotExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitBitOrExpression(ctx: BitOrExpressionContext) {
        return BitOrExpressionTypeClass.create(ctx);
    }

    visitArrayExpression(ctx: ArrayExpressionContext) {
        return ArrayExpressionTypeClass.create(ctx);
    }

    visitNewExpression(ctx: NewExpressionContext) {
        console.log('解析を開始します。' + 'NewExpressionContext:  ' + ctx.getText());
        const result = makeNewExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'NewExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAssignExpression(ctx: AssignExpressionContext) {
        return AssignExpressionTypeClass.create(ctx);
    }

    visitMethodCallExpression(ctx: MethodCallExpressionContext) {
        console.log('解析を開始します。' + 'MethodCallExpressionContext:  ' + ctx.getText());
        const result = makeMethodCallExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MethodCallExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'CastExpressionContext:  ' + ctx.getText());
        const result = makeCastExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CastExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'CondExpressionContext:  ' + ctx.getText());
        const result = makeCondExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CondExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'InstanceOfExpressionContext:  ' + ctx.getText());
        const result = makeInstanceOfExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'InstanceOfExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
