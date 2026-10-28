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
} from '../commons';

import {
    SoslWithClauseType,
    WithClauseType,
    FilteringExpressionType,
    NetworkListType,
    DataCategorySelectionType,
    DataCategoryNameType,
    FilteringSelectorType,
} from '../converter';

import { makeLogicalConditionJson, LogicalConditionJson } from './commons';
import { makeExpressionJsonConvert, BaseExpressionJson } from '../expression';

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
        DataCategorySelectionType,
        DataCategorySelectionJson
    >(
        ['dataCategorySelection'],
        target,
        'categoryCondition',
        (target, targetRecords) => {
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
    | {
          mode: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
      }
    | { mode: LogicalConditionJson }
    | { mode: 'DATA_CATEGORY'; selection: (DataCategorySelectionJson | ErrorJson)[] };

export const isWithJson = typia.createIs<WithJson>();

export const makeWithJson = (target: ConvertExcludeError<WithClauseType>): WithJson => {
    if (
        target.value === 'SYSTEM_MODE' ||
        target.value === 'USER_MODE' ||
        target.value === 'SECURITY_ENFORCED'
    ) {
        return {
            mode: target.value,
        };
    }
    if (target.value === 'DATA_CATEGORY') {
        return {
            mode: 'DATA_CATEGORY',
            selection: target.field.value.map((v) => makeDataCategorySelectionJson(v)),
        };
    }
    return {
        mode: makeLogicalConditionJson(target.value),
    };
};

export type SoslWithJson =
    | {
          mode: 'DIVISION' | 'PRICEBOOKID';
          value:
              | {
                    type: 'literal';
                    value: string;
                }
              | {
                    type: 'bind';
                    value: BaseExpressionJson | ErrorJson;
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
          mode: 'NETWORK';
          value: string[];
      }
    | {
          mode: 'METADATA';
          value: string;
      }
    | {
          mode: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE';
      };

export const makeSoslWithJson = (target: ConvertExcludeError<SoslWithClauseType>): SoslWithJson => {
    if (target.value === 'DIVISION' || target.value === 'PRICEBOOKID') {
        return {
            mode: target.value,
            value:
                typeof target.content === 'string'
                    ? { type: 'literal', value: target.content }
                    : {
                          type: 'bind',
                          value: makeExpressionJsonConvert(target.content.value),
                      },
        };
    } else if (target.value === 'DATA_CATEGORY') {
        return {
            mode: 'DATA_CATEGORY',
            value: target.content.value.map((item) => makeDataCategorySelectionJson(item)),
        };
    } else if (target.value === 'SNIPPET' || target.value === 'SPELL_CORRECTION') {
        return {
            mode: target.value,
            ...(target.content ? { value: target.content } : {}),
        };
    } else if (target.value === 'NETWORK') {
        return {
            mode: target.value,
            value: typeof target.content === 'string' ? [target.content] : target.content.value,
        };
    } else if (target.value === 'METADATA') {
        return {
            mode: 'METADATA',
            value: target.content,
        };
    } else {
        return {
            mode: target.value,
        };
    }
};
