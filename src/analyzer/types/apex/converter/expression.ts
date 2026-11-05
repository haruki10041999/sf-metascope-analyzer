import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { AnyIdType } from './id';
import { BasePrimaryType } from './primary';
import { FieldNameType } from './name';
import { SoqlFunctionType, ComparisonOperatorType } from './query';
import { ValueType } from './value';
import { DataCategorySelectionType } from './clause';
import { CreatorType } from './rest';
import { TypeRefType } from './type';
import { MethodCallType, DotMethodCallType } from './call';

export type ArrayExpressionType = CommonType<'arrayExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    index: ValueRuleValue<BaseExpressionType>;
};

export const isArrayExpressionType = (value: unknown): value is ArrayExpressionType => {
    return isCommonType(value) && value.type === 'arrayExpression';
};

export type Arth1ExpressionType = CommonType<'arth1Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '*' | '/';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth1ExpressionType = (value: unknown): value is Arth1ExpressionType => {
    return isCommonType(value) && value.type === 'arth1Expression';
};

export type Arth2ExpressionType = CommonType<'arth2Expression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '+' | '-';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isArth2ExpressionType = (value: unknown): value is Arth2ExpressionType => {
    return isCommonType(value) && value.type === 'arth2Expression';
};

export type AssignExpressionType = CommonType<'assignExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '=' | '+=' | '-=' | '*=' | '/=' | '&=' | '|=' | '^=' | '>>=' | '>>>=' | '<<=';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isAssignExpressionType = (value: unknown): value is AssignExpressionType => {
    return isCommonType(value) && value.type === 'assignExpression';
};

export type BitAndExpressionType = CommonType<'bitAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitAndExpressionType = (value: unknown): value is BitAndExpressionType => {
    return isCommonType(value) && value.type === 'bitAndExpression';
};

export type BitExpressionType = CommonType<'bitExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitExpressionType = (value: unknown): value is BitExpressionType => {
    return isCommonType(value) && value.type === 'bitExpression';
};

export type BitNotExpressionType = CommonType<'bitNotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '^';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitNotExpressionType = (value: unknown): value is BitNotExpressionType => {
    return isCommonType(value) && value.type === 'bitNotExpression';
};

export type BitOrExpressionType = CommonType<'bitOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '|';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isBitOrExpressionType = (value: unknown): value is BitOrExpressionType => {
    return isCommonType(value) && value.type === 'bitOrExpression';
};

export type BoundExpressionType = CommonType<'boundExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isBoundExpressionType = (value: unknown): value is BoundExpressionType => {
    return isCommonType(value) && value.type === 'boundExpression';
};

export type CastExpressionType = CommonType<'castExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isCastExpressionType = (value: unknown): value is CastExpressionType => {
    return isCommonType(value) && value.type === 'castExpression';
};

export type CmpExpressionType = CommonType<'cmpExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: string;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCmpExpressionType = (value: unknown): value is CmpExpressionType => {
    return isCommonType(value) && value.type === 'cmpExpression';
};

export type CoalExpressionType = CommonType<'coalExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '??';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isCoalExpressionType = (value: unknown): value is CoalExpressionType => {
    return isCommonType(value) && value.type === 'coalExpression';
};

export type CondExpressionType = CommonType<'condExpression'> & {
    condition: ValueRuleValue<BaseExpressionType>;
    trueValue: ValueRuleValue<BaseExpressionType>;
    falseValue: ValueRuleValue<BaseExpressionType>;
};

export const isCondExpressionType = (value: unknown): value is CondExpressionType => {
    return isCommonType(value) && value.type === 'condExpression';
};

export type ConditionalExpressionType = CommonType<'conditionalExpression'> & {
    value: ValueRuleValue<FieldExpressionType | LogicalExpressionType>;
};

export const isConditionalExpressionType = (value: unknown): value is ConditionalExpressionType => {
    return isCommonType(value) && value.type === 'conditionalExpression';
};

export type DotExpressionType = CommonType<'dotExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '.' | '?.';
    right: ValueRuleValue<AnyIdType | DotMethodCallType>;
};

export const isDotExpressionType = (value: unknown): value is DotExpressionType => {
    return isCommonType(value) && value.type === 'dotExpression';
};

export type EqualityExpressionType = CommonType<'equalityExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '===' | '!==' | '==' | '!=' | '<>';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isEqualityExpressionType = (value: unknown): value is EqualityExpressionType => {
    return isCommonType(value) && value.type === 'equalityExpression';
};

export type FieldExpressionType = CommonType<'fieldExpression'> & {
    left: ValueRuleValue<FieldNameType | SoqlFunctionType>;
    operator: ValueRuleValue<ComparisonOperatorType>;
    right: ValueRuleValue<ValueType>;
};

export const isFieldExpressionType = (value: unknown): value is FieldExpressionType => {
    return isCommonType(value) && value.type === 'fieldExpression';
};

export type FilteringExpressionType = CommonType<'filteringExpression'> & {
    value: ValueRuleValue<DataCategorySelectionType>[];
};

export const isFilteringExpressionType = (value: unknown): value is FilteringExpressionType => {
    return isCommonType(value) && value.type === 'filteringExpression';
};

export type InstanceOfExpressionType = CommonType<'instanceOfExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: 'instanceof';
    right: ValueRuleValue<TypeRefType>;
};

export const isInstanceOfExpressionType = (value: unknown): value is InstanceOfExpressionType => {
    return isCommonType(value) && value.type === 'instanceOfExpression';
};

export type LogAndExpressionType = CommonType<'logAndExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '&&';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogAndExpressionType = (value: unknown): value is LogAndExpressionType => {
    return isCommonType(value) && value.type === 'logAndExpression';
};

export type LogicalExpressionType = CommonType<'logicalExpression'> & {
    value: ValueRuleValue<ConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export const isLogicalExpressionType = (value: unknown): value is LogicalExpressionType => {
    return isCommonType(value) && value.type === 'logicalExpression';
};

export type LogOrExpressionType = CommonType<'logOrExpression'> & {
    left: ValueRuleValue<BaseExpressionType>;
    operator: '||';
    right: ValueRuleValue<BaseExpressionType>;
};

export const isLogOrExpressionType = (value: unknown): value is LogOrExpressionType => {
    return isCommonType(value) && value.type === 'logOrExpression';
};

export type MethodCallExpressionType = CommonType<'methodCallExpression'> & {
    value: ValueRuleValue<MethodCallType>;
};

export const isMethodCallExpressionType = (value: unknown): value is MethodCallExpressionType => {
    return isCommonType(value) && value.type === 'methodCallExpression';
};

export type NegExpressionType = CommonType<'negExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '~' | '!';
};

export const isNegExpressionType = (value: unknown): value is NegExpressionType => {
    return isCommonType(value) && value.type === 'negExpression';
};

export type NewExpressionType = CommonType<'newExpression'> & {
    value: ValueRuleValue<CreatorType>;
};

export const isNewExpressionType = (value: unknown): value is NewExpressionType => {
    return isCommonType(value) && value.type === 'newExpression';
};

export type ExpressionType = CommonType<'expression'> & {
    value: string;
};

export const isExpressionType = (value: unknown): value is ExpressionType => {
    return isCommonType(value) && value.type === 'expression';
};

export type ParExpressionType = CommonType<'parExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isParExpressionType = (value: unknown): value is ParExpressionType => {
    return isCommonType(value) && value.type === 'parExpression';
};

export type PostOpExpressionType = CommonType<'postOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--';
};

export const isPostOpExpressionType = (value: unknown): value is PostOpExpressionType => {
    return isCommonType(value) && value.type === 'postOpExpression';
};

export type PreOpExpressionType = CommonType<'preOpExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
    operator: '++' | '--' | '+' | '-';
};

export const isPreOpExpressionType = (value: unknown): value is PreOpExpressionType => {
    return isCommonType(value) && value.type === 'preOpExpression';
};

export type PrimaryExpressionType = CommonType<'primaryExpression'> & {
    value: ValueRuleValue<BasePrimaryType>;
};

export const isPrimaryExpressionType = (value: unknown): value is PrimaryExpressionType => {
    return isCommonType(value) && value.type === 'primaryExpression';
};

export type SubExpressionType = CommonType<'subExpression'> & {
    value: ValueRuleValue<BaseExpressionType>;
};

export const isSubExpressionType = (value: unknown): value is SubExpressionType => {
    return isCommonType(value) && value.type === 'subExpression';
};

export type WhereConditionalExpressionType = CommonType<'whereConditionalExpression'> & {
    value: ValueRuleValue<WhereFieldExpressionType | WhereLogicalExpressionType>;
};

export const isWhereConditionalExpressionType = (
    value: unknown,
): value is WhereConditionalExpressionType => {
    return isCommonType(value) && value.type === 'whereConditionalExpression';
};

export type WhereFieldExpressionType = CommonType<'whereFieldExpression'> & {
    left: ValueRuleValue<string | FieldExpressionType>;
    operator: ValueRuleValue<ComparisonOperatorType | null>;
    right: ValueRuleValue<ValueType | null>;
};

export const isWhereFieldExpressionType = (value: unknown): value is WhereFieldExpressionType => {
    return isCommonType(value) && value.type === 'whereFieldExpression';
};

export type WhereLogicalExpressionType = CommonType<'whereLogicalExpression'> & {
    value: ValueRuleValue<WhereConditionalExpressionType>[];
    operator: 'AND' | 'OR' | 'NOT' | null;
};

export const isWhereLogicalExpressionType = (
    value: unknown,
): value is WhereLogicalExpressionType => {
    return isCommonType(value) && value.type === 'whereLogicalExpression';
};

export type BaseExpressionType =
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
