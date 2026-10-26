import typia from 'typia';

import {
    Convert,
    isConvert,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    ConvertExcludeError,
    ConvertType,
    convertValue,
    StructureJsonType,
} from '../commons';

import { SubQueryType } from '../converter';

import { SelectJson, makeSelectJson } from './select';

export type SubQueryJson = StructureJsonType<'subQuery', { value: JsonType<'hoge'> }>;

export const isSubQueryJson = typia.createIs<SubQueryJson>();

export const makeSubQueryJson = (
    target: ConvertType<SubQueryType>,
    targetRecords?: Record<string, string[]>,
): SubQueryJson | ErrorJson => {
    return convertValue<'subQuery', 'subQuery', SubQueryType, SubQueryJson>(
        ['subQuery'],
        target,
        ['subQuery'],
        'subQuery',
        (_target, _targetRecords) => {
            return {
                kind: 'subQuery',
                sourceKeys: {},
                value: makeJsonType('hoge', _targetRecords, {}),
            };
        },
        targetRecords,
    );
};
