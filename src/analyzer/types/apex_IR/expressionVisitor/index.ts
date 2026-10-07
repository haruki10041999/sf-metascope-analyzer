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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ExpressionAllTypeClass } from './base';

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
import { MethodCallExpressionTypeClass } from './methodCallExpression';
import { NegExpressionTypeClass } from './negExpression';
import { NewExpressionTypeClass } from './newExpression';
import { NormalExpressionTypeClass } from './normal';
import { PostOpExpressionTypeClass } from './postOpExpression';
import { PreOpExpressionTypeClass } from './preOpExpression';
import { PrimaryExpressionTypeClass } from './primaryExpression';
import { SubExpressionTypeClass } from './subExpression';
import { ParExpressionTypeClass } from './parExpression';
import { BoundExpressionTypeClass } from './boundExpression';
import { FilteringExpressionTypeClass } from './filteringExpression';
import { FieldExpressionTypeClass } from './fieldExpression';
import { ConditionalExpressionTypeClass } from './conditionalExpression';
import { LogicalExpressionTypeClass } from './logicalExpression';
import { WhereLogicalExpressionTypeClass } from './whereLogicalExpression';
import { WhereConditionalExpressionTypeClass } from './whereConditionalExpression';
import { WhereFieldExpressionTypeClass } from './whereFieldExpression';

import { CommonVisitor } from '../commonVisitor';

export { isArrayExpressionType, ArrayExpressionTypeClass } from './arrayExpression';
export { isArth1ExpressionType, Arth1ExpressionTypeClass } from './arth1Expression';
export { isArth2ExpressionType, Arth2ExpressionTypeClass } from './arth2Expression';
export { isWhereFieldExpressionType, WhereFieldExpressionTypeClass } from './whereFieldExpression';
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
export { isMethodCallExpressionType, MethodCallExpressionTypeClass } from './methodCallExpression';
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
export { isLogicalExpressionType, LogicalExpressionTypeClass } from './logicalExpression';
export { isFieldExpressionType, FieldExpressionTypeClass } from './fieldExpression';
export {
    isWhereLogicalExpressionType,
    WhereLogicalExpressionTypeClass,
} from './whereLogicalExpression';
export {
    isWhereConditionalExpressionType,
    WhereConditionalExpressionTypeClass,
} from './whereConditionalExpression';
export { isFilteringExpressionType, FilteringExpressionTypeClass } from './filteringExpression';

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
        return MethodCallExpressionTypeClass.create(ctx);
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
        return FilteringExpressionTypeClass.create(ctx);
    }

    visitFieldExpression(ctx: FieldExpressionContext) {
        return FieldExpressionTypeClass.create(ctx);
    }

    visitConditionalExpression(ctx: ConditionalExpressionContext) {
        return ConditionalExpressionTypeClass.create(ctx);
    }

    visitLogicalExpression(ctx: LogicalExpressionContext) {
        return LogicalExpressionTypeClass.create(ctx);
    }

    visitWhereLogicalExpression(ctx: WhereLogicalExpressionContext) {
        return WhereLogicalExpressionTypeClass.create(ctx);
    }

    visitWhereConditionalExpression(ctx: WhereConditionalExpressionContext) {
        return WhereConditionalExpressionTypeClass.create(ctx);
    }

    visitWhereFieldExpression(ctx: WhereFieldExpressionContext) {
        return WhereFieldExpressionTypeClass.create(ctx);
    }
}

