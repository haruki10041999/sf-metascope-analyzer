import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ErrorJson,
    isErrorJson,
    JsonType,
    makeJsonType,
    convertExcludeError,
    mergeRecord,
    convertValue,
    ConvertType,
    StructureJsonType,
    makeStructureJsonType,
} from '../commons';

import {
    SoslWithClauseType,
    WithClauseType,
    FilteringExpressionType,
    DataCategorySelectionType,
    DataCategoryNameType,
    FilteringSelectorType,
} from '../converter';

import { makeLogicalConditionJson, LogicalConditionJson } from './commons';
import { ExpressionJson } from '../expression';

const makeDataCategoryNameJson = (target: ConvertExcludeError<DataCategoryNameType>): string[] => {
    return target.value.map((v) => v.value.value);
};

const makeFilteringSelectorJson = (
    target: ConvertExcludeError<FilteringSelectorType>,
): 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW' => {
    return target.value;
};

export type DataCategorySelectionJson = JsonType<'categoryCondition'> & {
    group: string;
    selector: 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';
    category: string[];
};

export const isDataCategorySelectionJson = typia.createIs<DataCategorySelectionJson>();

const makeDataCategorySelectionJson = (
    target: ConvertType<DataCategorySelectionType>,
    targetRecords?: Record<string, string[]>,
): DataCategorySelectionJson | ErrorJson => {
    return convertValue<
        'dataCategorySelection',
        'categoryCondition',
        DataCategorySelectionType,
        DataCategorySelectionJson
    >(
        ['dataCategorySelection'],
        target,
        ['categoryCondition'],
        'categoryCondition',
        (target, targetRecords, _) => {
            return makeJsonType('categoryCondition', targetRecords, {
                group: target.value.value.value,
                selector: makeFilteringSelectorJson(target.selector),
                category: makeDataCategoryNameJson(target.category),
            });
        },
        targetRecords,
    );
};

export type WithJson =
    | (JsonType<'withClause'> & {
          mode: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
      })
    | StructureJsonType<'withClause', { mode: LogicalConditionJson | ErrorJson }>
    | ({ mode: 'DATA_CATEGORY' } & StructureJsonType<
          'withClause',
          { selection: (DataCategorySelectionJson | ErrorJson)[] }
      >);

export const makeWithJson = (
    target: Convert<WithClauseType>,
    targetRecords?: Record<string, string[]>,
): WithJson | ErrorJson => {
    return convertValue<'withClause', 'withClause', WithClauseType, WithJson>(
        ['withClause'],
        target,
        ['withClause'],
        'withClause',
        (target, targetRecords, _) => {
            if (
                target.value === 'SYSTEM_MODE' ||
                target.value === 'USER_MODE' ||
                target.value === 'SECURITY_ENFORCED'
            ) {
                return makeJsonType('withClause', targetRecords, {
                    mode: target.value,
                });
            }
            if (target.value === 'DATA_CATEGORY') {
                return makeStructureJsonType(
                    'withClause',
                    {
                        selection: target.field.value.map((v) =>
                            makeDataCategorySelectionJson(v, targetRecords),
                        ),
                    },
                    { mode: 'DATA_CATEGORY' },
                );
            }
            return makeStructureJsonType('withClause', {
                mode: makeLogicalConditionJson(target.value),
            });
        },
        targetRecords,
    );
};

export type SoslWithJson = JsonType<'withClause'> &
    (
        | {
              mode: 'DIVISION' | 'PRICEBOOKID';
              value:
                  | {
                        type: 'literal';
                        value: string;
                    }
                  | {
                        type: 'bind';
                        value: ExpressionJson;
                    };
          }
        | {
              mode: 'DATA_CATEGORY';
              value: (DataCategorySelectionJson | ErrorJson)[];
          }
        | {
              mode: 'SNIPPET' | 'SPELL_CORRECTION';
              value?: string;
          }
        | {
              mode: 'NETWORK' | 'METADATA';
              value: string;
          }
        | {
              mode: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE';
          }
    );
