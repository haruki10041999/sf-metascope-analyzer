import {
    SoqlFunctionContext,
    DateFieldNameContext,
    FieldNameContext,
} from '@apexdevtools/apex-parser';

import { SoqlField, makeSoqlField } from '../field';

export type DateSoqlFunctionName =
    | 'CALENDAR_MONTH'
    | 'CALENDAR_QUARTER'
    | 'CALENDAR_YEAR'
    | 'DAY_IN_MONTH'
    | 'DAY_IN_WEEK'
    | 'DAY_IN_YEAR'
    | 'DAY_ONLY'
    | 'FISCAL_MONTH'
    | 'FISCAL_QUARTER'
    | 'FISCAL_YEAR'
    | 'HOUR_IN_DAY'
    | 'WEEK_IN_MONTH'
    | 'WEEK_IN_YEAR';

export type DateFunctionType = {
    type: DateSoqlFunctionName;
    field: SoqlField;
    isConvertTimeZone: boolean;
};

export const isDateFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return (
        ctx.CALENDAR_MONTH() !== undefined ||
        ctx.CALENDAR_QUARTER() !== undefined ||
        ctx.CALENDAR_YEAR() !== undefined ||
        ctx.DAY_IN_MONTH() !== undefined ||
        ctx.DAY_IN_WEEK() !== undefined ||
        ctx.DAY_IN_YEAR() !== undefined ||
        ctx.DAY_ONLY() !== undefined ||
        ctx.FISCAL_MONTH() !== undefined ||
        ctx.FISCAL_QUARTER() !== undefined ||
        ctx.FISCAL_YEAR() !== undefined ||
        ctx.HOUR_IN_DAY() !== undefined ||
        ctx.WEEK_IN_MONTH() !== undefined ||
        ctx.WEEK_IN_YEAR() !== undefined
    );
};

export const makeDateSoqlFunctionName = (ctx: SoqlFunctionContext): DateSoqlFunctionName => {
    if (ctx.CALENDAR_MONTH()) return 'CALENDAR_MONTH';
    if (ctx.CALENDAR_QUARTER()) return 'CALENDAR_QUARTER';
    if (ctx.DAY_IN_MONTH()) return 'DAY_IN_MONTH';
    if (ctx.DAY_IN_WEEK()) return 'DAY_IN_WEEK';
    if (ctx.DAY_IN_YEAR()) return 'DAY_IN_YEAR';
    if (ctx.DAY_ONLY()) return 'DAY_ONLY';
    if (ctx.FISCAL_MONTH()) return 'FISCAL_MONTH';
    if (ctx.FISCAL_QUARTER()) return 'FISCAL_QUARTER';
    if (ctx.FISCAL_YEAR()) return 'FISCAL_YEAR';
    if (ctx.HOUR_IN_DAY()) return 'HOUR_IN_DAY';
    if (ctx.WEEK_IN_MONTH()) return 'WEEK_IN_MONTH';
    if (ctx.WEEK_IN_YEAR()) return 'WEEK_IN_YEAR';

    throw new Error(`値が異常です。SoqlFunctionContext:${ctx.getText()}`);
};

export const makeDateFunctionType = (
    type: DateSoqlFunctionName,
    ctx: DateFieldNameContext,
): DateFunctionType => {
    const field = makeSoqlField(ctx.fieldName());
    const isConvertTimeZone = ctx.CONVERT_TIMEZONE() !== undefined;
    return {
        type: type,
        field: field,
        isConvertTimeZone: isConvertTimeZone,
    };
};
