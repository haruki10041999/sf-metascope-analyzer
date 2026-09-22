import {
    GroupByClauseContext,
    FieldGroupByListContext,
    FieldGroupByContext,
} from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from './field';
import { SoqlFunctionField, makeSoqlFunctionField } from './function';
import { HavingField, makeHavingField } from './having';

export type GroupByField = {
    fields: {
        order: number;
        field: SoqlField | SoqlFunctionField[];
    }[];
    mode: 'None' | 'ROLLUP' | 'CUBE';
    having?: HavingField;
};

export const makeGroupByField = (ctx: GroupByClauseContext): GroupByField => {
    let mode: 'None' | 'ROLLUP' | 'CUBE' = 'None';
    if (ctx.ROLLUP()) {
        mode = 'ROLLUP';
    } else if (ctx.CUBE()) {
        mode = 'CUBE';
    }

    const fields: {
        order: number;
        field: SoqlField | SoqlFunctionField[];
    }[] = [];

    ctx.fieldGroupByList()
        .fieldGroupBy_list()
        .forEach((field, index) => {
            if (field.soqlFunction()) {
                fields.push({
                    order: index + 1,
                    field: makeSoqlFunctionField(field.soqlFunction()),
                });
                return;
            }
            fields.push({
                order: index + 1,
                field: makeSoqlField(field.fieldName()),
            });
        });

    const having = ctx.logicalExpression() ? makeHavingField(ctx.logicalExpression()) : undefined;

    return {
        fields,
        mode,
        ...(having ? { having } : {}),
    };
};
