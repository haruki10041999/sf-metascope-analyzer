import { FieldListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';
import { QueryType, QueryVisitor } from '../queryVisitor';

export type FieldListType = {
    type: 'fieldList';
    list: (
        | IdType
        | { value: IdType; function?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' }
        | {
              value: QueryType;
              firstFunction?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
          }
    )[];
};

export const makeFieldListType = (ctx: FieldListContext): FieldListType => {
    if (
        (!ctx.soslId_list() || ctx.soslId_list().length === 0) &&
        (!ctx.fieldList_list() || ctx.fieldList_list().length === 0) &&
        !ctx.soqlFunction()
    ) {
        throw new Error('値が異常です。FieldListContext: ' + ctx.getText());
    }

    const list: (
        | IdType
        | { value: IdType; function?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' }
        | {
              value: QueryType;
              firstFunction?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
          }
    )[] = [];

    if (ctx.soslId_list().length === 1) {
        const value = new IdVisitor().visit(ctx.soslId(0));

        const listValue: {
            value: IdType;
            function?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
        } = {
            value: value,
        };

        if (ctx.TOLABEL()) {
            listValue.function = 'TOLABEL';
        }

        if (ctx.CONVERT_CURRENCY()) {
            listValue.function = 'CONVERT_CURRENCY';
        }

        if (ctx.FORMAT()) {
            listValue.function = 'FORMAT';
        }

        list.push(listValue);
    } else {
        list.push(
            ...ctx.soslId_list().map((soslIdCtx) => {
                const value = new IdVisitor().visit(soslIdCtx);

                return value;
            }),
        );
    }

    if (ctx.soqlFunction()) {
        const soqlFunction = new QueryVisitor().visit(ctx.soqlFunction());

        const value: {
            value: QueryType;
            firstFunction?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
        } = {
            value: soqlFunction,
        };

        if (ctx.TOLABEL()) {
            value.firstFunction = 'TOLABEL';
        }

        if (ctx.CONVERT_CURRENCY()) {
            value.firstFunction = 'CONVERT_CURRENCY';
        }

        if (ctx.FORMAT()) {
            value.firstFunction = 'FORMAT';
        }

        list.push(value);
    }

    if (ctx.fieldList_list() && ctx.fieldList_list().length > 0) {
        ctx.fieldList_list().forEach((nestedCtx) => {
            const fieldList = new ListVisitor().visit(nestedCtx);

            if (fieldList.type === 'fieldList') {
                list.push(...fieldList.list);
            }
        });
    }

    return {
        type: 'fieldList',
        list: list,
    };
};
