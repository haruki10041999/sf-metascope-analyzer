import type { ArrayExpressionTypeClass } from './arrayExpression';
import type { Arth1ExpressionTypeClass } from './arth1Expression';
import type { Arth2ExpressionTypeClass } from './arth2Expression';
import type { AssignExpressionTypeClass } from './assignExpression';
import type { BitAndExpressionTypeClass } from './bitAndExpression';
import type { BitExpressionTypeClass } from './bitExpression';
import type { BitNotExpressionTypeClass } from './bitNotExpression';
import type { BitOrExpressionTypeClass } from './bitOrExpression';
import type { CastExpressionTypeClass } from './castExpression';
import type { CmpExpressionTypeClass } from './cmpExpression';
import type { CoalExpressionTypeClass } from './coalExpression';
import type { CondExpressionTypeClass } from './condExpression';
import type { DotExpressionTypeClass } from './dotExpression';
import type { EqualityExpressionTypeClass } from './equalityExpression';
import type { InstanceOfExpressionTypeClass } from './instanceOfExpression';
import type { LogAndExpressionTypeClass } from './logAndExpression';
import type { LogOrExpressionTypeClass } from './logOrExpression';
import type { MethodCallExpressionTypeClass } from './methodCallExpression';
import type { NegExpressionTypeClass } from './negExpression';
import type { NewExpressionTypeClass } from './newExpression';
import type { NormalExpressionTypeClass } from './normal';
import type { PostOpExpressionTypeClass } from './postOpExpression';
import type { PreOpExpressionTypeClass } from './preOpExpression';
import type { PrimaryExpressionTypeClass } from './primaryExpression';
import type { SubExpressionTypeClass } from './subExpression';

export type BasedExpressionTypeClass =
    | NormalExpressionTypeClass
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
