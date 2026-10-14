import { GroupByClauseClass, isStringArray, isSoqlFunctionClass } from '../converter';

import { LogicalField, makeLogicalField } from './common';
import { SoqlFunctionField, makeSoqlFunctionField } from './soqlFunction';

export type GroupByField = {
    field: (
        | {
              kind: 'field';
              field: string[];
          }
        | {
              kind: 'function';
              field: SoqlFunctionField;
          }
    )[];
    mode?: string;
    having?: LogicalField;
};

export const makeGroupByField = (groupByClause: GroupByClauseClass): GroupByField | undefined => {
    const groupByField: GroupByField = {
        field: [],
    };

    const value = groupByClause.getValue();
    const mode = groupByClause.getMode();
    const having = groupByClause.getHaving();

    value.forEach((v) => {
        if (isStringArray(v) && v.length > 0) {
            groupByField.field.push({
                kind: 'field',
                field: v,
            });
        }

        if (isSoqlFunctionClass(v)) {
            const func = makeSoqlFunctionField(v);
            if (func) {
                groupByField.field.push({
                    kind: 'function',
                    field: func,
                });
            }
        }
    });

    if (mode) {
        groupByField.mode = mode;
    }

    if (having.getValue().length > 0) {
        const logicalField = makeLogicalField(having);
        if (logicalField) {
            groupByField.having = logicalField;
        }
    }

    if (groupByField.field.length > 0) {
        return groupByField;
    }

    return undefined;
};
