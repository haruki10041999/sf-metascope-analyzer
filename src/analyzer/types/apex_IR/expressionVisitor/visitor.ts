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
} from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, ApexCommonVisitor } from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import {
    ArrayExpressionTypeClass,
    isArrayExpressionType,
    type ArrayExpressionType,
} from './arrayExpression';
import {
    Arth1ExpressionTypeClass,
    isArth1ExpressionType,
    type Arth1ExpressionType,
} from './arth1Expression';
import {
    Arth2ExpressionTypeClass,
    isArth2ExpressionType,
    type Arth2ExpressionType,
} from './arth2Expression';
import {
    AssignExpressionTypeClass,
    isAssignExpressionType,
    type AssignExpressionType,
} from './assignExpression';
import {
    BitAndExpressionTypeClass,
    isBitAndExpressionType,
    type BitAndExpressionType,
} from './bitAndExpression';
import {
    BitExpressionTypeClass,
    isBitExpressionType,
    type BitExpressionType,
} from './bitExpression';
import {
    BitNotExpressionTypeClass,
    isBitNotExpressionType,
    type BitNotExpressionType,
} from './bitNotExpression';
import {
    BitOrExpressionTypeClass,
    isBitOrExpressionType,
    type BitOrExpressionType,
} from './bitOrExpression';
import {
    CastExpressionTypeClass,
    isCastExpressionType,
    type CastExpressionType,
} from './castExpression';
import {
    CmpExpressionTypeClass,
    isCmpExpressionType,
    type CmpExpressionType,
} from './cmpExpression';
import {
    CoalExpressionTypeClass,
    isCoalExpressionType,
    type CoalExpressionType,
} from './coalExpression';
import {
    CondExpressionTypeClass,
    isCondExpressionType,
    type CondExpressionType,
} from './condExpression';
import {
    DotExpressionTypeClass,
    isDotExpressionType,
    type DotExpressionType,
} from './dotExpression';
import {
    EqualityExpressionTypeClass,
    isEqualityExpressionType,
    type EqualityExpressionType,
} from './equalityExpression';
import {
    InstanceOfExpressionTypeClass,
    type InstanceOfExpressionType,
} from './instanceOfExpression';
import {
    LogAndExpressionTypeClass,
    isLogAndExpressionType,
    type LogAndExpressionType,
} from './logAndExpression';
import {
    LogOrExpressionTypeClass,
    isLogOrExpressionType,
    type LogOrExpressionType,
} from './logOrExpression';
import {
    MethodCallExpressionTypeClass,
    type MethodCallExpressionType,
} from './methodCallExpression';
import {
    NegExpressionTypeClass,
    isNegExpressionType,
    type NegExpressionType,
} from './negExpression';
import {
    NewExpressionTypeClass,
    isNewExpressionType,
    type NewExpressionType,
} from './newExpression';
import { ExpressionTypeClass, isExpressionType, type ExpressionType } from './expression';
import {
    PostOpExpressionTypeClass,
    isPostOpExpressionType,
    type PostOpExpressionType,
} from './postOpExpression';
import {
    PreOpExpressionTypeClass,
    isPreOpExpressionType,
    type PreOpExpressionType,
} from './preOpExpression';
import {
    PrimaryExpressionTypeClass,
    isPrimaryExpressionType,
    type PrimaryExpressionType,
} from './primaryExpression';
import {
    SubExpressionTypeClass,
    isSubExpressionType,
    type SubExpressionType,
} from './subExpression';

export type BasedExpressionType =
    | ExpressionType
    | PrimaryExpressionType
    | DotExpressionType
    | MethodCallExpressionType
    | NewExpressionType
    | CastExpressionType
    | SubExpressionType
    | ArrayExpressionType
    | Arth1ExpressionType
    | Arth2ExpressionType
    | AssignExpressionType
    | BitAndExpressionType
    | BitExpressionType
    | BitOrExpressionType
    | BitNotExpressionType
    | CmpExpressionType
    | CoalExpressionType
    | CondExpressionType
    | EqualityExpressionType
    | InstanceOfExpressionType
    | LogAndExpressionType
    | LogOrExpressionType
    | NegExpressionType
    | PostOpExpressionType
    | PreOpExpressionType;

export type BasedExpressionTypeClass =
    | ExpressionTypeClass
    | PrimaryExpressionTypeClass
    | DotExpressionTypeClass
    | MethodCallExpressionTypeClass
    | NewExpressionTypeClass
    | CastExpressionTypeClass
    | SubExpressionTypeClass
    | ArrayExpressionTypeClass
    | Arth1ExpressionTypeClass
    | Arth2ExpressionTypeClass
    | AssignExpressionTypeClass
    | BitAndExpressionTypeClass
    | BitExpressionTypeClass
    | BitOrExpressionTypeClass
    | BitNotExpressionTypeClass
    | CmpExpressionTypeClass
    | CoalExpressionTypeClass
    | CondExpressionTypeClass
    | EqualityExpressionTypeClass
    | InstanceOfExpressionTypeClass
    | LogAndExpressionTypeClass
    | LogOrExpressionTypeClass
    | NegExpressionTypeClass
    | PostOpExpressionTypeClass
    | PreOpExpressionTypeClass;

export const isBasedExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BasedExpressionTypeClass => {
    return (
        target instanceof ExpressionTypeClass ||
        target instanceof PrimaryExpressionTypeClass ||
        target instanceof DotExpressionTypeClass ||
        target instanceof MethodCallExpressionTypeClass ||
        target instanceof NewExpressionTypeClass ||
        target instanceof CastExpressionTypeClass ||
        target instanceof SubExpressionTypeClass ||
        target instanceof ArrayExpressionTypeClass ||
        target instanceof Arth1ExpressionTypeClass ||
        target instanceof Arth2ExpressionTypeClass ||
        target instanceof AssignExpressionTypeClass ||
        target instanceof BitAndExpressionTypeClass ||
        target instanceof BitExpressionTypeClass ||
        target instanceof BitOrExpressionTypeClass ||
        target instanceof BitNotExpressionTypeClass ||
        target instanceof CmpExpressionTypeClass ||
        target instanceof CoalExpressionTypeClass ||
        target instanceof CondExpressionTypeClass ||
        target instanceof EqualityExpressionTypeClass ||
        target instanceof InstanceOfExpressionTypeClass ||
        target instanceof LogAndExpressionTypeClass ||
        target instanceof LogOrExpressionTypeClass ||
        target instanceof NegExpressionTypeClass ||
        target instanceof PostOpExpressionTypeClass ||
        target instanceof PreOpExpressionTypeClass
    );
};

/**
 * ExpressionContext は文脈のクラス (ラベル付きの選択肢) で分かれるので Visitor で振り分ける。
 * SOQL の条件など ExpressionContext 以外の規則 (OtherExpressionTypeClass) も、互換のためここで作れる
 */
export class ExpressionVisitor extends ApexCommonVisitor<BasedExpressionTypeClass> {
    visitExpression(ctx: ExpressionContext) {
        return ExpressionTypeClass.create(ctx);
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
}
