import { LiteralPrimaryJson, PrimaryJson, SoslJson, SoqlJson, TypeJson } from '../../../types';
import { ValueDiff, makeValueDiff } from './commons';
import { TypeDiff, makeTypeDiff } from './type';
import { SoqlDiff, makeSoqlDiff } from './query/soql';
import { SoslDiff, makeSoslDiff } from './query/sosl';
import { TypedObjectDiff } from './typed';

export type LiteralPrimaryDiff = TypedObjectDiff<
    LiteralPrimaryJson,
    {
        value: ValueDiff<string>;
        valueType: ValueDiff<LiteralPrimaryJson['valueType']>;
    }
>;
export type PrimaryDiff =
    | ValueDiff<string>
    | LiteralPrimaryDiff
    | TypeDiff
    | SoqlDiff
    | SoslDiff
    | { status: 'changed'; before: PrimaryJson; after: PrimaryJson };

export const makeLiteralPrimaryDiff = (
    before: LiteralPrimaryJson,
    after: LiteralPrimaryJson,
): LiteralPrimaryDiff =>
    before.value === after.value && before.valueType === after.valueType
        ? { status: 'unchanged', value: before }
        : {
              status: 'changed',
              fields: {
                  value: makeValueDiff(before.value, after.value),
                  valueType: makeValueDiff(before.valueType, after.valueType),
              },
          };

export const makePrimaryDiff = (before: PrimaryJson, after: PrimaryJson): PrimaryDiff => {
    if (typeof before === 'string' && typeof after === 'string') {
        return makeValueDiff(before, after);
    }
    if (
        typeof before === 'object' &&
        'kind' in before &&
        typeof after === 'object' &&
        'kind' in after
    ) {
        if (before.kind !== after.kind) return { status: 'changed', before, after };
        switch (before.kind) {
            case 'type':
                return makeTypeDiff(before as TypeJson, after as TypeJson);
            case 'soql':
                return makeSoqlDiff(before as SoqlJson, after as SoqlJson);
            case 'sosl':
                return makeSoslDiff(before as SoslJson, after as SoslJson);
        }
        return { status: 'changed', before, after };
    }
    if (
        typeof before === 'object' &&
        'valueType' in before &&
        typeof after === 'object' &&
        'valueType' in after
    ) {
        return makeLiteralPrimaryDiff(before as LiteralPrimaryJson, after as LiteralPrimaryJson);
    }
    return { status: 'changed', before, after };
};
