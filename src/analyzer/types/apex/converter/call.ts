import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { AnyIdType, IdType } from './id';
import { ExpressionListType } from './list';

export type DotMethodCallType = CommonType<'dotMethodCall'> & {
    value: ValueRuleValue<AnyIdType>;
    param: ValueRuleValue<ExpressionListType | null>;
};

export const isDotMethodCallType = (value: unknown): value is DotMethodCallType => {
    return isCommonType(value) && value.type === 'dotMethodCall';
};

export type MethodCallType = CommonType<'methodCall'> &
    (
        | {
              value: ValueRuleValue<IdType>;
              param: ValueRuleValue<ExpressionListType | null>;
              reference: 'this' | 'super' | null;
          }
        | {
              value: 'this' | 'super';
              param: ValueRuleValue<ExpressionListType | null>;
          }
    );

export const isMethodCallType = (value: unknown): value is MethodCallType => {
    return isCommonType(value) && value.type === 'methodCall';
};
