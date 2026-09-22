import { SoqlFunctionContext, FieldNameContext } from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from '../field';

export type NormalSoqlFunctionName =
    | 'AVG'
    | 'COUNT_DISTINCT'
    | 'MIN'
    | 'MAX'
    | 'SUM'
    | 'TOLABEL'
    | 'FORMAT'
    | 'GROUPING'
    | 'CONVERT_CURRENCY';

export type NormalSoqlFunctionType = {
    type: NormalSoqlFunctionName;
    field: SoqlField;
};

export const isNormalSoqlFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return (
        ctx.AVG() !== undefined ||
        ctx.COUNT_DISTINCT() !== undefined ||
        ctx.MIN() !== undefined ||
        ctx.MAX() !== undefined ||
        ctx.SUM() !== undefined ||
        ctx.TOLABEL() !== undefined ||
        ctx.FORMAT() !== undefined ||
        ctx.GROUPING() !== undefined ||
        ctx.CONVERT_CURRENCY() !== undefined
    );
};

export const makeNormalSoqlFunctionName = (ctx: SoqlFunctionContext): NormalSoqlFunctionName => {
    if (ctx.AVG()) return 'AVG';
    if (ctx.COUNT_DISTINCT()) return 'COUNT_DISTINCT';
    if (ctx.MIN()) return 'MIN';
    if (ctx.MAX()) return 'MAX';
    if (ctx.SUM()) return 'SUM';
    if (ctx.TOLABEL()) return 'TOLABEL';
    if (ctx.FORMAT()) return 'FORMAT';
    if (ctx.GROUPING()) return 'GROUPING';
    if (ctx.CONVERT_CURRENCY()) return 'CONVERT_CURRENCY';

    throw new Error(`値が異常です。SoqlFunctionContext:${ctx.getText()}`);
};

export const makeNormalSoqlFunctionType = (
    type: NormalSoqlFunctionName,
    ctx: FieldNameContext,
): NormalSoqlFunctionType => {
    return {
        type: type,
        field: makeSoqlField(ctx),
    };
};
