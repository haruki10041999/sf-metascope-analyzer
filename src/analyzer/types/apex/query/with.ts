import { WithClauseClass, isLogicalExpressionClass, isString } from '../converter';

import { LogicalField, makeLogicalField } from './common';

export type WithField =
    | {
          kind: string;
          categories?: {
              field: string;
              selector: string;
              category: string[];
          }[];
      }
    | {
          kind: 'filtering';
          value: LogicalField;
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
                const categories: {
                    field: string;
                    selector: string;
                    category: string[];
                }[] = [];

                field.forEach((f) => {
                    const valueValue = f.getValue();
                    const selector = f.getSelector();
                    const category = f.getCategory();

                    if (valueValue && selector && category.length > 0) {
                        categories.push({
                            field: valueValue,
                            selector: selector,
                            category: category,
                        });
                    }
                });
                withField.categories = categories;
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
