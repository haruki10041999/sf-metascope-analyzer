import {
    WithClauseClass,
    SoslWithClauseClass,
    isLogicalExpressionClass,
    isString,
    isStringArray,
    isExpressionClass,
    DataCategorySelectionClass,
    isDataCategorySelectionClassArray,
} from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { LogicalField, makeLogicalField } from './common';

export type DataCategoryField = {
    field: string;
    selector: string;
    category: string[];
};

export type WithField =
    | {
          kind: string;
          categories?: DataCategoryField[];
      }
    | {
          kind: 'filtering';
          value: LogicalField;
      };

export type SoslWithField = {
    kind: string;
    param?: string | string[] | ExpressionType | DataCategoryField[];
};

export const makeDataCategoryField = (
    dataCategory: DataCategorySelectionClass[],
): DataCategoryField[] | undefined => {
    const categories: DataCategoryField[] = [];

    dataCategory.forEach((dc) => {
        const valueValue = dc.getValue();
        const selector = dc.getSelector();
        const category = dc.getCategory();

        if (valueValue && selector && category.length > 0) {
            categories.push({
                field: valueValue,
                selector: selector,
                category: category,
            });
        }
    });

    if (categories.length > 0) {
        return categories;
    }

    return undefined;
};

export const makewithField = (withClause: WithClauseClass): WithField | undefined => {
    const value = withClause.getValue();
    const field = withClause.getField();

    if (value) {
        if (isString(value)) {
            const withField: WithField = {
                kind: value,
            };

            if (field.length > 0) {
                const categories = makeDataCategoryField(field);
                if (categories) {
                    withField.categories = categories;
                }
            }

            return withField;
        }

        if (isLogicalExpressionClass(value)) {
            const logicalField = makeLogicalField(value);
            if (logicalField) {
                return {
                    kind: 'filtering',
                    value: logicalField,
                };
            }
        }
    }

    return undefined;
};

export const makeSoslWithField = (
    soslWithClause: SoslWithClauseClass[],
): SoslWithField[] | undefined => {
    const soslWithFields: SoslWithField[] = [];

    soslWithClause.forEach((withClause) => {
        const kind = withClause.getValue();
        const param = withClause.getContent();

        if (kind) {
            const soslWithField: SoslWithField = {
                kind: kind,
            };

            if (param) {
                if (isString(param)) {
                    soslWithField.param = param.replace(/^(['"])(.*)\1$/, '$2');
                }

                if (isStringArray(param) && param.length > 0) {
                    soslWithField.param = param.map((p) => p.replace(/^(['"])(.*)\1$/, '$2'));
                }

                if (isExpressionClass(param)) {
                    const expression = makeExpressionType(param);
                    if (expression) {
                        soslWithField.param = expression;
                    }
                }

                if (isDataCategorySelectionClassArray(param)) {
                    const categories = makeDataCategoryField(param);
                    if (categories) {
                        soslWithField.param = categories;
                    }
                }
            }
            soslWithFields.push(soslWithField);
        }
    });

    if (soslWithFields.length > 0) {
        return soslWithFields;
    }

    return undefined;
};
