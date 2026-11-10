import {
    CoordinateElementJson,
    CoordinateValueJson,
    DateFieldNameJson,
    DistanceValueJson,
    SoqlFunctionJson,
} from '../../../../types';

import {
    OptionalDiff,
    ValueDiff,
    isSameValue,
    makeOptionalDiff,
    makeValueDiff,
} from '../../../commons/diff/commons';
import { FieldPathDiff, makeFieldPathDiff } from './select';

export type DateFieldNameJsonDiff = {
    name: FieldPathDiff;
    isConvertTimeZone: ValueDiff<boolean>;
};

export type DistanceValueJsonDiff = {
    field: ValueDiff<DistanceValueJson['field']>;
    target: ValueDiff<DistanceValueJson['target']>;
    unit: ValueDiff<string>;
};

export type NestedSoqlFunctionDiff = {
    func: ValueDiff<string>;
    arg: ValueDiff<Exclude<Extract<SoqlFunctionJson, { func: 'FORMAT' }>['arg'], string[]>['arg']>;
};

export type SoqlFunctionArgDiff =
    | ValueDiff<NonNullable<SoqlFunctionJson['arg']>>
    | {
          status: 'changed';
          fields:
              | { type: 'fieldPath'; value: FieldPathDiff }
              | { type: 'dateFieldName'; value: DateFieldNameJsonDiff }
              | { type: 'distance'; value: DistanceValueJsonDiff }
              | { type: 'nestedFunction'; value: NestedSoqlFunctionDiff };
      };

export type SoqlFunctionJsonDiff = {
    type: SoqlFunctionJson['type'];
    func: ValueDiff<SoqlFunctionJson['func']>;
    arg: OptionalDiff<NonNullable<SoqlFunctionJson['arg']>, SoqlFunctionArgDiff>;
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((part) => typeof part === 'string');

const isDateFieldName = (value: unknown): value is DateFieldNameJson =>
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    isStringArray(value.name) &&
    'isConvertTimeZone' in value &&
    typeof value.isConvertTimeZone === 'boolean';

const isDistanceValue = (value: unknown): value is DistanceValueJson =>
    typeof value === 'object' &&
    value !== null &&
    'field' in value &&
    'target' in value &&
    'unit' in value &&
    typeof value.unit === 'string';

const isNestedFunction = (
    value: unknown,
): value is Exclude<Extract<SoqlFunctionJson, { func: 'FORMAT' }>['arg'], string[]> =>
    typeof value === 'object' && value !== null && !Array.isArray(value) && 'func' in value;

const makeDistanceValueDiff = (
    before: DistanceValueJson,
    after: DistanceValueJson,
): DistanceValueJsonDiff => ({
    field: makeValueDiff(before.field, after.field),
    target: makeValueDiff(before.target, after.target),
    unit: makeValueDiff(before.unit, after.unit),
});

const makeSoqlFunctionArgDiff = (
    beforeFunc: SoqlFunctionJson['func'],
    afterFunc: SoqlFunctionJson['func'],
    before: NonNullable<SoqlFunctionJson['arg']>,
    after: NonNullable<SoqlFunctionJson['arg']>,
): SoqlFunctionArgDiff => {
    if (isSameValue(before, after) || beforeFunc !== afterFunc) return makeValueDiff(before, after);
    if (
        Array.isArray(before) &&
        Array.isArray(after) &&
        isStringArray(before) &&
        isStringArray(after)
    ) {
        return {
            status: 'changed',
            fields: { type: 'fieldPath', value: makeFieldPathDiff(before, after) },
        };
    }
    if (beforeFunc === 'DISTANCE' && isDistanceValue(before) && isDistanceValue(after)) {
        return {
            status: 'changed',
            fields: { type: 'distance', value: makeDistanceValueDiff(before, after) },
        };
    }
    if (beforeFunc === 'FORMAT' && isNestedFunction(before) && isNestedFunction(after)) {
        return {
            status: 'changed',
            fields: {
                type: 'nestedFunction',
                value: {
                    func: makeValueDiff(before.func, after.func),
                    arg: makeValueDiff(before.arg, after.arg),
                },
            },
        };
    }
    if (isDateFieldName(before) && isDateFieldName(after)) {
        return {
            status: 'changed',
            fields: {
                type: 'dateFieldName',
                value: {
                    name: makeFieldPathDiff(before.name, after.name),
                    isConvertTimeZone: makeValueDiff(
                        before.isConvertTimeZone,
                        after.isConvertTimeZone,
                    ),
                },
            },
        };
    }
    return makeValueDiff(before, after);
};

export const makeSoqlFunctionDiff = (
    before: SoqlFunctionJson,
    after: SoqlFunctionJson,
): SoqlFunctionJsonDiff => ({
    type: 'soqlFunction',
    func: makeValueDiff(before.func, after.func),
    arg: makeOptionalDiff(before.arg, after.arg, (beforeArg, afterArg) =>
        makeSoqlFunctionArgDiff(before.func, after.func, beforeArg, afterArg),
    ),
});

/** DISTANCE の座標は値として比べる */
export type CoordinateElementJsonDiff = ValueDiff<CoordinateElementJson>;
export type CoordinateValueJsonDiff = ValueDiff<CoordinateValueJson>;
