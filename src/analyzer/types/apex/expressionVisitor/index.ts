import {
    ApexParserBaseVisitor,
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
} from '@apexdevtools/apex-parser';

import { ArrayExpressionType, makeArrayExpressionType } from './arrayExpression';
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
import { ExpressionType as expressionType, makeExpressionType } from './expression';
import { PostOpExpressionType, makePostOpExpressionType } from './postOpExpression';
import { PreOpExpressionType, makePreOpExpressionType } from './preOpExpression';
import { PrimaryExpressionType, makePrimaryExpressionType } from './primaryExpression';
import { SubExpressionType, makeSubExpressionType } from './subExpression';
import { ParExpressionType, makeParExpressionType } from './parExpression';
import { BoundExpressionType, makeBoundExpressionType } from './boundExpression';
import { FilteringExpressionType, makeFilteringExpressionType } from './filteringExpression';

export type ExpressionType =
    | ArrayExpressionType
    | Arth1ExpressionType
    | Arth2ExpressionType
    | AssignExpressionType
    | BitAndExpressionType
    | BitExpressionType
    | BitNotExpressionType
    | BitOrExpressionType
    | CastExpressionType
    | CmpExpressionType
    | CoalExpressionType
    | CondExpressionType
    | DotExpressionType
    | EqualityExpressionType
    | InstanceOfExpressionType
    | LogAndExpressionType
    | LogOrExpressionType
    | MethodCallExpressionType
    | NegExpressionType
    | NewExpressionType
    | expressionType
    | PostOpExpressionType
    | PreOpExpressionType
    | PrimaryExpressionType
    | SubExpressionType
    | ParExpressionType
    | BoundExpressionType
    | FilteringExpressionType;

export class ExpressionVisitor extends ApexParserBaseVisitor<ExpressionType> {
    visitExpressionContext(ctx: ExpressionContext) {
        return makeExpressionType(ctx);
    }

    visitPrimaryExpressionContext(ctx: PrimaryExpressionContext) {
        return makePrimaryExpressionType(ctx);
    }

    visitArth1ExpressionContext(ctx: Arth1ExpressionContext) {
        return makeArth1ExpressionType(ctx);
    }

    visitCoalExpressionContext(ctx: CoalExpressionContext) {
        return makeCoalExpressionType(ctx);
    }

    visitDotExpressionContext(ctx: DotExpressionContext) {
        return makeDotExpressionType(ctx);
    }

    visitBitOrExpressionContext(ctx: BitOrExpressionContext) {
        return makeBitOrExpressionType(ctx);
    }

    visitArrayExpressionContext(ctx: ArrayExpressionContext) {
        return makeArrayExpressionType(ctx);
    }

    visitNewExpressionContext(ctx: NewExpressionContext) {
        return makeNewExpressionType(ctx);
    }

    visitAssignExpressionContext(ctx: AssignExpressionContext) {
        return makeAssignExpressionType(ctx);
    }

    visitMethodCallExpressionContext(ctx: MethodCallExpressionContext) {
        return makeMethodCallExpressionType(ctx);
    }

    visitBitNotExpressionContext(ctx: BitNotExpressionContext) {
        return makeBitNotExpressionType(ctx);
    }

    visitArth2ExpressionContext(ctx: Arth2ExpressionContext) {
        return makeArth2ExpressionType(ctx);
    }

    visitLogAndExpressionContext(ctx: LogAndExpressionContext) {
        return makeLogAndExpressionType(ctx);
    }

    visitCastExpressionContext(ctx: CastExpressionContext) {
        return makeCastExpressionType(ctx);
    }

    visitBitAndExpressionContext(ctx: BitAndExpressionContext) {
        return makeBitAndExpressionType(ctx);
    }

    visitCmpExpressionContext(ctx: CmpExpressionContext) {
        return makeCmpExpressionType(ctx);
    }

    visitBitExpressionContext(ctx: BitExpressionContext) {
        return makeBitExpressionType(ctx);
    }

    visitLogOrExpressionContext(ctx: LogOrExpressionContext) {
        return makeLogOrExpressionType(ctx);
    }

    visitCondExpressionContext(ctx: CondExpressionContext) {
        return makeCondExpressionType(ctx);
    }

    visitEqualityExpressionContext(ctx: EqualityExpressionContext) {
        return makeEqualityExpressionType(ctx);
    }

    visitPostOpExpressionContext(ctx: PostOpExpressionContext) {
        return makePostOpExpressionType(ctx);
    }

    visitNegExpressionContext(ctx: NegExpressionContext) {
        return makeNegExpressionType(ctx);
    }

    visitPreOpExpressionContext(ctx: PreOpExpressionContext) {
        return makePreOpExpressionType(ctx);
    }

    visitSubExpressionContext(ctx: SubExpressionContext) {
        return makeSubExpressionType(ctx);
    }

    visitInstanceOfExpressionContext(ctx: InstanceOfExpressionContext) {
        return makeInstanceOfExpressionType(ctx);
    }

    visitParExpressionContext(ctx: ParExpressionContext) {
        return makeParExpressionType(ctx);
    }

    visitBoundExpressionContext(ctx: BoundExpressionContext) {
        return makeBoundExpressionType(ctx);
    }

    visitFilteringExpressionContext(ctx: FilteringExpressionContext) {
        return makeFilteringExpressionType(ctx);
    }
}
