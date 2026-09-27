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
    FieldExpressionContext,
    ConditionalExpressionContext,
    LogicalExpressionContext,
    WhereLogicalExpressionContext,
    WhereConditionalExpressionContext,
    WhereFieldExpressionContext,
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
    | FilteringExpressionType
    | FieldExpressionType
    | ConditionalExpressionType
    | LogicalExpressionType
    | WhereLogicalExpressionType
    | WhereConditionalExpressionType
    | WhereFieldExpressionType;

export class ExpressionVisitor extends ApexParserBaseVisitor<ExpressionType> {
    visitExpression(ctx: ExpressionContext) {
        return makeExpressionType(ctx);
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
        return makePostOpExpressionType(ctx);
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

    visitParExpression(ctx: ParExpressionContext) {
        return makeParExpressionType(ctx);
    }

    visitBoundExpression(ctx: BoundExpressionContext) {
        return makeBoundExpressionType(ctx);
    }

    visitFilteringExpression(ctx: FilteringExpressionContext) {
        return makeFilteringExpressionType(ctx);
    }

    visitFieldExpression(ctx: FieldExpressionContext) {
        return makeFieldExpressionType(ctx);
    }

    visitConditionalExpression(ctx: ConditionalExpressionContext) {
        return makeConditionalExpressionType(ctx);
    }

    VisitLogicalExpression(ctx: LogicalExpressionContext) {
        return makeLogicalExpressionType(ctx);
    }

    visitWhereLogicalExpression(ctx: WhereLogicalExpressionContext) {
        return makeWhereLogicalExpressionType(ctx);
    }

    visitWhereConditionalExpression(ctx: WhereConditionalExpressionContext) {
        return makeWhereConditionalExpressionType(ctx);
    }

    visitWhereFieldExpression(ctx: WhereFieldExpressionContext) {
        return makeWhereFieldExpressionType(ctx);
    }
}
