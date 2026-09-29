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
import { Arth1ExpressionType, makeArth1ExpressionType } from './arth1Expression';
import { Arth2ExpressionType, makeArth2ExpressionType } from './arth2Expression';
import { AssignExpressionType, makeAssignExpressionType } from './assignExpression';
import { BitAndExpressionType, makeBitAndExpressionType } from './bitAndExpression';
import { BitExpressionType, makeBitExpressionType } from './bitExpression';
import { BitNotExpressionType, makeBitNotExpressionType } from './bitNotExpression';
import { BitOrExpressionType, makeBitOrExpressionType } from './bitOrExpression';
import { CastExpressionType, makeCastExpressionType } from './castExpression';
import { CmpExpressionType, makeCmpExpressionType } from './cmpExpression';
import { CoalExpressionType, makeCoalExpressionType } from './coalExpression';
import { CondExpressionType, makeCondExpressionType } from './condExpression';
import { DotExpressionType, makeDotExpressionType } from './dotExpression';
import { EqualityExpressionType, makeEqualityExpressionType } from './equalityExpression';
import { InstanceOfExpressionType, makeInstanceOfExpressionType } from './instanceOfExpression';
import { LogAndExpressionType, makeLogAndExpressionType } from './logAndExpression';
import { LogOrExpressionType, makeLogOrExpressionType } from './logOrExpression';
import { MethodCallExpressionType, makeMethodCallExpressionType } from './methodCallExpression';
import { NegExpressionType, makeNegExpressionType } from './negExpression';
import { NewExpressionType, makeNewExpressionType } from './newExpression';
import { ExpressionTypeClass as expressionTypeClass } from './expression';
import { PostOpExpressionType, makePostOpExpressionType } from './postOpExpression';
import { PreOpExpressionType, makePreOpExpressionType } from './preOpExpression';
import { PrimaryExpressionTypeClass } from './primaryExpression';
import { SubExpressionType, makeSubExpressionType } from './subExpression';
import { ParExpressionType, makeParExpressionType } from './parExpression';
import { BoundExpressionType, makeBoundExpressionType } from './boundExpression';
import { FilteringExpressionType, makeFilteringExpressionType } from './filteringExpression';
import { FieldExpressionType, makeFieldExpressionType } from './fieldExpression';
import { ConditionalExpressionType, makeConditionalExpressionType } from './conditionalExpression';
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

export { isArrayExpressionType } from './arrayExpression';
export { isExpressionType } from './expression';
export { isPrimaryExpressionType } from './primaryExpression';

export class ExpressionTypeClass extends ContextTypeClass {
    value: any | null = null;

    constructor(type: string, value: any | null, errorClasses: ErrorTypeClass[]) {
        super(type, errorClasses);
        this.value = value;
    }

    getValue(): any | null {
        return this.value;
    }
}

export const isExpressionTypeAll = (target: CommonTypeClass): target is ExpressionTypeClass => {
    return target instanceof ExpressionTypeClass;
};

export class ExpressionVisitor extends CommonVisitor<ExpressionTypeClass> {
    visitExpression(ctx: ExpressionContext) {
        return expressionTypeClass.create(ctx);
    }

    visitPrimaryExpression(ctx: PrimaryExpressionContext) {
        return PrimaryExpressionTypeClass.create(ctx);
    }

    visitArth1Expression(ctx: Arth1ExpressionContext) {
        console.log('解析を開始します。' + 'Arth1ExpressionContext:  ' + ctx.getText());
        const result = makeArth1ExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'Arth1ExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitCoalExpression(ctx: CoalExpressionContext) {
        console.log('解析を開始します。' + 'CoalExpressionContext:  ' + ctx.getText());
        const result = makeCoalExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CoalExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'BitOrExpressionContext:  ' + ctx.getText());
        const result = makeBitOrExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BitOrExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'AssignExpressionContext:  ' + ctx.getText());
        const result = makeAssignExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AssignExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'BitNotExpressionContext:  ' + ctx.getText());
        const result = makeBitNotExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BitNotExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitArth2Expression(ctx: Arth2ExpressionContext) {
        console.log('解析を開始します。' + 'Arth2ExpressionContext:  ' + ctx.getText());
        const result = makeArth2ExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'Arth2ExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLogAndExpression(ctx: LogAndExpressionContext) {
        console.log('解析を開始します。' + 'LogAndExpressionContext:  ' + ctx.getText());
        const result = makeLogAndExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LogAndExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'BitAndExpressionContext:  ' + ctx.getText());
        const result = makeBitAndExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BitAndExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitCmpExpression(ctx: CmpExpressionContext) {
        console.log('解析を開始します。' + 'CmpExpressionContext:  ' + ctx.getText());
        const result = makeCmpExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CmpExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitBitExpression(ctx: BitExpressionContext) {
        console.log('解析を開始します。' + 'BitExpressionContext:  ' + ctx.getText());
        const result = makeBitExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BitExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLogOrExpression(ctx: LogOrExpressionContext) {
        console.log('解析を開始します。' + 'LogOrExpressionContext:  ' + ctx.getText());
        const result = makeLogOrExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LogOrExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'EqualityExpressionContext:  ' + ctx.getText());
        const result = makeEqualityExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'EqualityExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitPostOpExpression(ctx: PostOpExpressionContext) {
        console.log('解析を開始します。' + 'PostOpExpressionContext:  ' + ctx.getText());
        const result = makePostOpExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'PostOpExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitNegExpression(ctx: NegExpressionContext) {
        console.log('解析を開始します。' + 'NegExpressionContext:  ' + ctx.getText());
        const result = makeNegExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'NegExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitPreOpExpression(ctx: PreOpExpressionContext) {
        console.log('解析を開始します。' + 'PreOpExpressionContext:  ' + ctx.getText());
        const result = makePreOpExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'PreOpExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSubExpression(ctx: SubExpressionContext) {
        console.log('解析を開始します。' + 'SubExpressionContext:  ' + ctx.getText());
        const result = makeSubExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SubExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'ParExpressionContext:  ' + ctx.getText());
        const result = makeParExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ParExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitBoundExpression(ctx: BoundExpressionContext) {
        console.log('解析を開始します。' + 'BoundExpressionContext:  ' + ctx.getText());
        const result = makeBoundExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BoundExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
        console.log('解析を開始します。' + 'ConditionalExpressionContext:  ' + ctx.getText());
        const result = makeConditionalExpressionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ConditionalExpressionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
