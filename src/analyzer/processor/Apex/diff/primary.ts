import { LiteralPrimaryJson, PrimaryJson, SoslJson, SoqlJson, TypeJson } from '../../../types';
import {
    ReplacementDiff,
    ValueDiff,
    makeReplacementDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypeJsonDiff, makeTypeDiff } from './type';
import { SoqlJsonDiff, makeSoqlDiff } from './query/soql';
import { SoslJsonDiff, makeSoslDiff } from './query/sosl';
import { TypedObjectDiff } from '../../commons/diff/list';

export type LiteralPrimaryJsonDiff = TypedObjectDiff<
    LiteralPrimaryJson,
    {
        value: ValueDiff<string>;
        valueType: ValueDiff<LiteralPrimaryJson['valueType']>;
    }
>;
export type PrimaryJsonDiff =
    | ValueDiff<string>
    | LiteralPrimaryJsonDiff
    | TypeJsonDiff
    | SoqlJsonDiff
    | SoslJsonDiff
    | ReplacementDiff<PrimaryJson>;

export const makeLiteralPrimaryDiff = (
    before: LiteralPrimaryJson,
    after: LiteralPrimaryJson,
): LiteralPrimaryJsonDiff =>
    before.value === after.value && before.valueType === after.valueType
        ? { status: 'unchanged', value: before }
        : {
              status: 'changed',
              fields: {
                  value: makeValueDiff(before.value, after.value),
                  valueType: makeValueDiff(before.valueType, after.valueType),
              },
          };

export const makePrimaryDiff = (before: PrimaryJson, after: PrimaryJson): PrimaryJsonDiff => {
    if (typeof before === 'string' && typeof after === 'string') {
        return makeValueDiff(before, after);
    }
    if (
        typeof before === 'object' &&
        'kind' in before &&
        typeof after === 'object' &&
        'kind' in after
    ) {
        if (before.kind !== after.kind) return makeReplacementDiff(before, after);
        switch (before.kind) {
            case 'type':
                return makeTypeDiff(before as TypeJson, after as TypeJson);
            case 'soql':
                return makeSoqlDiff(before as SoqlJson, after as SoqlJson);
            case 'sosl':
                return makeSoslDiff(before as SoslJson, after as SoslJson);
        }
        return makeReplacementDiff(before, after);
    }
    if (
        typeof before === 'object' &&
        'valueType' in before &&
        typeof after === 'object' &&
        'valueType' in after
    ) {
        return makeLiteralPrimaryDiff(before as LiteralPrimaryJson, after as LiteralPrimaryJson);
    }
    return makeReplacementDiff(before, after);
};
