import { FieldListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';

import { SoqlFunctionType, makeSoqlFunctionType } from '../soqlFunction';

export type FieldListType = {
    type: 'fieldList';
    list: (
        | Omit<IdType, 'type'>
        | { value: Omit<IdType, 'type'>; function: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' }
        | {
              value: Omit<SoqlFunctionType, 'type'>;
              firstFunction?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
          }
    )[];
};

export const makeFieldListType = (ctx: FieldListContext): FieldListType => {
    const list: (
        | { value: Omit<IdType, 'type'>; function?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' }
        | {
              value: Omit<SoqlFunctionType, 'type'>;
              firstFunction?: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT';
          }
    )[] = [];

    if (ctx.soslId_list().length === 1) {
        const { type, ...value } = new IdVisitor().visit(ctx.soslId(0));

        const listValue: {
            value: Omit<IdType, 'type'>;
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
                const { type, ...value } = new IdVisitor().visit(soslIdCtx);
                return value;
            }),
        );
    }

    if (ctx.soqlFunction()) {
        const { type, ...soqlFunction } = makeSoqlFunctionType(ctx.soqlFunction());

        const value: {
            value: Omit<SoqlFunctionType, 'type'>;
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
            const { type, list: fieldList } = new ListVisitor().visit(nestedCtx);

            if (type === 'fieldList') {
                list.push(...fieldList);
            }
        });
    }

    return {
        type: 'fieldList',
        list: list,
    };
};
