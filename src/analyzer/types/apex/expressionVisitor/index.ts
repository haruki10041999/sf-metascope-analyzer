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
} from '@apexdevtools/apex-parser';

import { ArrayExpressionType, makeArrayExpressionType } from './array';
import { Arth1ExpressionType, makeArth1ExpressionType } from './arth1';
import { Arth2ExpressionType, makeArth2ExpressionType } from './arth2';
import { AssignExpressionType, makeAssignExpressionType } from './assign';
import { BitAndExpressionType, makeBitAndExpressionType } from './bitAnd';
import { BitExpressionType, makeBitExpressionType } from './bit';
import { BitNotExpressionType, makeBitNotExpressionType } from './bitNot';
import { BitOrExpressionType, makeBitOrExpressionType } from './bitOr';
import { CastExpressionType, makeCastExpressionType } from './cast';
import { CmpExpressionType, makeCmpExpressionType } from './cmp';
import { CoalExpressionType, makeCoalExpressionType } from './coal';
import { CondExpressionType, makeCondExpressionType } from './cond';
import { DotExpressionType, makeDotExpressionType } from './dot';
import { EqualityExpressionType, makeEqualityExpressionType } from './equality';
import { InstanceOfExpressionType, makeInstanceOfExpressionType } from './instanceOf';
import { LogAndExpressionType, makeLogAndExpressionType } from './logAnd';
import { LogOrExpressionType, makeLogOrExpressionType } from './logOr';
import { MethodCallExpressionType, makeMethodCallExpressionType } from './methodCall';
import { NegExpressionType, makeNegExpressionType } from './neg';
import { NewExpressionType, makeNewExpressionType } from './new';
import { NormalExpressionType, makeNormalType } from './normal';
import { PostOpExpressionType, makePostOrExpressionType } from './postOp';
import { PreOpExpressionType, makePreOpExpressionType } from './preOp';
import { PrimaryExpressionType, makePrimaryExpressionType } from './primary';
import { SubExpressionType, makeSubExpressionType } from './sub';

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
    | NormalExpressionType
    | PostOpExpressionType
    | PreOpExpressionType
    | PrimaryExpressionType
    | SubExpressionType;

export class ExpressionVisitor extends ApexParserBaseVisitor<ExpressionType> {
    visitExpression(ctx: ExpressionContext) {
        return makeNormalType(ctx);
    }

    visitPrimaryExpression(ctx: PrimaryExpressionContext) {
        return makePrimaryExpressionType(ctx);
    }

    visitArth1Expression(ctx: Arth1ExpressionContext) {
        return makeArth1ExpressionType(ctx);
    }

    visitCoalExpression(ctx: CoalExpressionContext) {
        return makeCoalExpressionType(ctx);
    }

    visitDotExpression(ctx: DotExpressionContext) {
        return makeDotExpressionType(ctx);
    }

    visitBitOrExpression(ctx: BitOrExpressionContext) {
        return makeBitOrExpressionType(ctx);
    }

    visitArrayExpression(ctx: ArrayExpressionContext) {
        return makeArrayExpressionType(ctx);
    }

    visitNewExpression(ctx: NewExpressionContext) {
        return makeNewExpressionType(ctx);
    }

    visitAssignExpression(ctx: AssignExpressionContext) {
        return makeAssignExpressionType(ctx);
    }

    visitMethodCallExpression(ctx: MethodCallExpressionContext) {
        return makeMethodCallExpressionType(ctx);
    }

    visitBitNotExpression(ctx: BitNotExpressionContext) {
        return makeBitNotExpressionType(ctx);
    }

    visitArth2Expression(ctx: Arth2ExpressionContext) {
        return makeArth2ExpressionType(ctx);
    }

    visitLogAndExpression(ctx: LogAndExpressionContext) {
        return makeLogAndExpressionType(ctx);
    }

    visitCastExpression(ctx: CastExpressionContext) {
        return makeCastExpressionType(ctx);
    }

    visitBitAndExpression(ctx: BitAndExpressionContext) {
        return makeBitAndExpressionType(ctx);
    }

    visitCmpExpression(ctx: CmpExpressionContext) {
        return makeCmpExpressionType(ctx);
    }

    visitBitExpression(ctx: BitExpressionContext) {
        return makeBitExpressionType(ctx);
    }

    visitLogOrExpression(ctx: LogOrExpressionContext) {
        return makeLogOrExpressionType(ctx);
    }

    visitCondExpression(ctx: CondExpressionContext) {
        return makeCondExpressionType(ctx);
    }

    visitEqualityExpression(ctx: EqualityExpressionContext) {
        return makeEqualityExpressionType(ctx);
    }

    visitPostOpExpression(ctx: PostOpExpressionContext) {
        return makePostOrExpressionType(ctx);
    }

    visitNegExpression(ctx: NegExpressionContext) {
        return makeNegExpressionType(ctx);
    }

    visitPreOpExpression(ctx: PreOpExpressionContext) {
        return makePreOpExpressionType(ctx);
    }

    visitSubExpression(ctx: SubExpressionContext) {
        return makeSubExpressionType(ctx);
    }

    visitInstanceOfExpression(ctx: InstanceOfExpressionContext) {
        return makeInstanceOfExpressionType(ctx);
    }
}
