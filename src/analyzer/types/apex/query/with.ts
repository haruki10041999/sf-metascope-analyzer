import typia from 'typia';

import { JsonType } from '../../commons';
import type {
    DataCategoryNameTypeClass,
    DataCategorySelectionTypeClass,
    FilteringExpressionTypeClass,
    FilteringSelectorTypeClass,
    SoslWithClauseTypeClass,
    WithClauseTypeClass,
} from '../../apex_IR';

import { makeNodeJson } from '../commons/node';
import { makeLogicalConditionJson, LogicalConditionJson } from './commons';
import { makeExpressionJsonConvert, BaseExpressionJson } from '../expression';

const makeDataCategoryNameJson = (target: DataCategoryNameTypeClass): string[] => {
    return target.getFields().value.map((v) => v.getFields().value.getFields().value);
};

const makeFilteringSelectorJson = (
    target: FilteringSelectorTypeClass,
): 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW' => {
    return target.getFields().value;
};

export type DataCategorySelectionJson = JsonType<'categoryCondition'> & {
    group: string;
    selector: 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';
    category: string[];
};

export const isDataCategorySelectionJson = typia.createIs<DataCategorySelectionJson>();

const makeDataCategorySelectionJson = (
    target: DataCategorySelectionTypeClass,
): DataCategorySelectionJson => {
    const { value, selector, category } = target.getFields();
    return makeNodeJson<DataCategorySelectionJson>('categoryCondition', target, {
        group: value.getFields().value.getFields().value,
        selector: makeFilteringSelectorJson(selector),
        category: makeDataCategoryNameJson(category),
    });
};

export type WithJson =
    | {
          mode: 'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED';
      }
    | { mode: LogicalConditionJson }
    | { mode: 'DATA_CATEGORY'; selection: DataCategorySelectionJson[] };

export const isWithJson = typia.createIs<WithJson>();

const makeDataCategorySelectionListJson = (
    target: FilteringExpressionTypeClass,
): DataCategorySelectionJson[] => {
    return target.getFields().value.map((v) => makeDataCategorySelectionJson(v));
};

export const makeWithJson = (target: WithClauseTypeClass): WithJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'SYSTEM_MODE':
        case 'USER_MODE':
        case 'SECURITY_ENFORCED':
            return {
                mode: fields.kind,
            };
        case 'DATA_CATEGORY':
            return {
                mode: 'DATA_CATEGORY',
                selection: makeDataCategorySelectionListJson(fields.filter),
            };
        case 'EXPRESSION':
            return {
                mode: makeLogicalConditionJson(fields.expression),
            };
    }
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
                    value: BaseExpressionJson;
                };
      }
    | {
          mode: 'DATA_CATEGORY';
          value: DataCategorySelectionJson[];
      }
    | {
          // WITH SNIPPET (target_length = n)。文法上のオプションは target_length だけ
          mode: 'SNIPPET';
          targetLength?: string;
      }
    | {
          mode: 'SPELL_CORRECTION';
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

export const makeSoslWithJson = (target: SoslWithClauseTypeClass): SoslWithJson => {
    const fields = target.getFields();
    switch (fields.kind) {
        case 'DIVISION':
        case 'PRICEBOOKID': {
            const content = fields.content;
            if (content.kind === 'literal') {
                return { mode: fields.kind, value: { type: 'literal', value: content.text } };
            }
            // バインド式 (:var) は中の式を出す
            return {
                mode: fields.kind,
                value: {
                    type: 'bind',
                    value: makeExpressionJsonConvert(content.expr.getFields().value),
                },
            };
        }
        case 'DATA_CATEGORY':
            return {
                mode: 'DATA_CATEGORY',
                value: makeDataCategorySelectionListJson(fields.content),
            };
        case 'SNIPPET':
            return {
                mode: fields.kind,
                ...(fields.targetLength ? { targetLength: fields.targetLength } : {}),
            };
        case 'SPELL_CORRECTION':
            return {
                mode: fields.kind,
                ...(fields.enabled ? { value: fields.enabled } : {}),
            };
        case 'NETWORK': {
            const content = fields.content;
            if (content.kind === 'eq') {
                return { mode: fields.kind, value: [content.text] };
            }
            return {
                mode: fields.kind,
                value: [...content.list.getFields().value],
            };
        }
        case 'METADATA':
            // 文字列リテラルがないとき (null) は、v1 と同じく value を持たない
            // (v1 は converter が null の content を落とし、value: undefined として JSON に出なかった)
            return fields.content !== null
                ? { mode: 'METADATA', value: fields.content }
                : ({ mode: 'METADATA' } as SoslWithJson);
        case 'HIGHLIGHT':
        case 'SYSTEM_MODE':
        case 'USER_MODE':
            return {
                mode: fields.kind,
            };
    }
};
