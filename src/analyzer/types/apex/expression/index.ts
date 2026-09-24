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
import { PrimaryExpression, makePrimaryExpression } from './primary';
import { SubExpressionType, makeSubExpressionType } from './sub';

export type ExpressionField =
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
    | PrimaryExpression
    | SubExpressionType;

export class ExpressionVisitor extends ApexParserBaseVisitor<ExpressionField> {
    visitExpression(ctx: ExpressionContext): ExpressionField {
        return makeNormalType(ctx);
    }

    visitPrimaryExpression(ctx: PrimaryExpressionContext): ExpressionField {
        return makePrimaryExpression(ctx);
    }

    visitArth1Expression(ctx: Arth1ExpressionContext): ExpressionField {
        return makeArth1ExpressionType(ctx);
    }

    visitCoalExpression(ctx: CoalExpressionContext): ExpressionField {
        return makeCoalExpressionType(ctx);
    }

    visitDotExpression(ctx: DotExpressionContext): ExpressionField {
        return makeDotExpressionType(ctx);
    }

    visitBitOrExpression(ctx: BitOrExpressionContext): ExpressionField {
        return makeBitOrExpressionType(ctx);
    }

    visitArrayExpression(ctx: ArrayExpressionContext): ExpressionField {
        return makeArrayExpressionType(ctx);
    }

    visitNewExpression(ctx: NewExpressionContext): ExpressionField {
        return makeNewExpressionType(ctx);
    }

    visitAssignExpression(ctx: AssignExpressionContext): ExpressionField {
        return makeAssignExpressionType(ctx);
    }

    visitMethodCallExpression(ctx: MethodCallExpressionContext): ExpressionField {
        return makeMethodCallExpressionType(ctx);
    }

    visitBitNotExpression(ctx: BitNotExpressionContext): ExpressionField {
        return makeBitNotExpressionType(ctx);
    }

    visitArth2Expression(ctx: Arth2ExpressionContext): ExpressionField {
        return makeArth2ExpressionType(ctx);
    }

    visitLogAndExpression(ctx: LogAndExpressionContext): ExpressionField {
        return makeLogAndExpressionType(ctx);
    }

    visitCastExpression(ctx: CastExpressionContext): ExpressionField {
        return makeCastExpressionType(ctx);
    }

    visitBitAndExpression(ctx: BitAndExpressionContext): ExpressionField {
        return makeBitAndExpressionType(ctx);
    }

    visitCmpExpression(ctx: CmpExpressionContext): ExpressionField {
        return makeCmpExpressionType(ctx);
    }

    visitBitExpression(ctx: BitExpressionContext): ExpressionField {
        return makeBitExpressionType(ctx);
    }

    visitLogOrExpression(ctx: LogOrExpressionContext): ExpressionField {
        return makeLogOrExpressionType(ctx);
    }

    visitCondExpression(ctx: CondExpressionContext): ExpressionField {
        return makeCondExpressionType(ctx);
    }

    visitEqualityExpression(ctx: EqualityExpressionContext): ExpressionField {
        return makeEqualityExpressionType(ctx);
    }

    visitPostOpExpression(ctx: PostOpExpressionContext): ExpressionField {
        return makePostOrExpressionType(ctx);
    }

    visitNegExpression(ctx: NegExpressionContext): ExpressionField {
        return makeNegExpressionType(ctx);
    }

    visitPreOpExpression(ctx: PreOpExpressionContext): ExpressionField {
        return makePreOpExpressionType(ctx);
    }

    visitSubExpression(ctx: SubExpressionContext): ExpressionField {
        return makeSubExpressionType(ctx);
    }

    visitInstanceOfExpression(ctx: InstanceOfExpressionContext): ExpressionField {
        return makeInstanceOfExpressionType(ctx);
    }
}
