import typia from 'typia';

import {
    ConvertExcludeError,
    ErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertType,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import {
    SoslWithClauseType,
    WithClauseType,
    DataCategorySelectionType,
    DataCategoryNameType,
    FilteringExpressionType,
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
): DataCategorySelectionJson | ErrorJson => {
    return convertValue<
        'dataCategorySelection',
        DataCategorySelectionType,
        DataCategorySelectionJson
    >(target, 'categoryCondition', (target, targetRecords) => {
        return makeJsonType('categoryCondition', targetRecords.base, {
            group: target.value.value.value,
            selector: makeFilteringSelectorJson(target.selector),
            category: makeDataCategoryNameJson(target.category),
        });
    });
};

export type WithJson =
    | {
          mode: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
      }
    | { mode: LogicalConditionJson | ErrorJson }
    | { mode: 'DATA_CATEGORY'; selection: (DataCategorySelectionJson | ErrorJson)[] | ErrorJson };

export const isWithJson = typia.createIs<WithJson>();

const makeDataCategorySelectionListJson = (
    target: ConvertType<FilteringExpressionType>,
): (DataCategorySelectionJson | ErrorJson)[] | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'categoryCondition');
    }
    return target.value.map((v) => makeDataCategorySelectionJson(v));
};

export const makeWithJson = (target: ConvertType<WithClauseType>): WithJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'with');
    }

    if (
        target.value === 'SYSTEM_MODE' ||
        target.value === 'USER_MODE' ||
        target.value === 'SECURITY_ENFORCED'
    ) {
        return {
            mode: target.value,
        };
    }
    if (target.value === 'DATA_CATEGORY' && 'field' in target) {
        return {
            mode: 'DATA_CATEGORY',
            selection: makeDataCategorySelectionListJson(target.field),
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
          value: (DataCategorySelectionJson | ErrorJson)[] | ErrorJson;
      }
    | {
          mode: 'SNIPPET' | 'SPELL_CORRECTION';
          value?: string;
      }
    | {
          mode: 'NETWORK';
          value: (string | ErrorJson)[] | ErrorJson;
      }
    | {
          mode: 'METADATA';
          value: string;
      }
    | {
          mode: 'HIGHLIGHT' | 'SYSTEM_MODE' | 'USER_MODE';
      };

export const makeSoslWithJson = (
    target: ConvertType<SoslWithClauseType>,
): SoslWithJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'soslWith');
    }

    if (target.value === 'DIVISION' || target.value === 'PRICEBOOKID') {
        if (typeof target.content === 'string') {
            return { mode: target.value, value: { type: 'literal', value: target.content } };
        }
        if (isErrorNode(target.content)) {
            return makeErrorJson(target.content, 'soslWith');
        }
        return {
            mode: target.value,
            value: {
                type: 'bind',
                value: makeExpressionJsonConvert(target.content.value),
            },
        };
    } else if (target.value === 'DATA_CATEGORY') {
        return {
            mode: 'DATA_CATEGORY',
            value: makeDataCategorySelectionListJson(target.content),
        };
    } else if (target.value === 'SNIPPET' || target.value === 'SPELL_CORRECTION') {
        return {
            mode: target.value,
            ...(target.content ? { value: target.content } : {}),
        };
    } else if (target.value === 'NETWORK') {
        if (typeof target.content === 'string') {
            return { mode: target.value, value: [target.content] };
        }
        if (isErrorNode(target.content)) {
            return makeErrorJson(target.content, 'soslWith');
        }
        return {
            mode: target.value,
            value: target.content.value.map((v) =>
                typeof v === 'string' ? v : makeErrorJson(v, 'soslWith'),
            ),
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

