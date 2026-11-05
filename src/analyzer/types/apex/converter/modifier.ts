import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { IdType } from './id';
import { ElementValueType } from './value';
import { ElementValuePairsType } from './pair';

export type AnnotationType = CommonType<'annotation'> & {
    value: ValueRuleValue<IdType>;
    param: ValueRuleValue<ElementValueType | ElementValuePairsType | null>;
};

export const isAnnotationType = (value: unknown): value is AnnotationType => {
    return isCommonType(value) && value.type === 'annotation';
};

export type ModifierType = CommonType<'modifier'> &
    (
        | {
              value:
                  | 'GLOBAL'
                  | 'PUBLIC'
                  | 'PROTECTED'
                  | 'PRIVATE'
                  | 'TRANSIENT'
                  | 'STATIC'
                  | 'ABSTRACT'
                  | 'FINAL'
                  | 'WEBSERVICE'
                  | 'OVERRIDE'
                  | 'VIRTUAL'
                  | 'TESTMETHOD'
                  | 'WITH_SHARING'
                  | 'WITHOUT_SHARING'
                  | 'INHERITED_SHARING';
          }
        | {
              value: ValueRuleValue<AnnotationType>;
          }
    );

export const isModifierType = (value: unknown): value is ModifierType => {
    return isCommonType(value) && value.type === 'modifier';
};
