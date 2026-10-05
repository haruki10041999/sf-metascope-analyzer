import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass, QueryVisitor } from '.';

import {
    DateFieldNameTypeClass,
    FieldNameTypeClass,
    NameVisitor,
    isDateFieldNameType,
    isFieldNameType,
} from '../nameVisitor';
import {
    SoqlFieldsParameterTypeClass,
    ParameterVisitor,
    isSoqlFieldsParameterType,
} from '../parameterVisitor';
import { LocationValueTypeClass, ValueVisitor, isLocationValueType } from '../valueVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

type NormalSoqlFunctionType =
    'AVG' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'SUM' | 'TOLABEL' | 'GROUPING' | 'CONVERT_CURRENCY';
type CountFunctionType = 'COUNT';
type FormatFunctionType = 'FORMAT';
type FieldsFunctionType = 'FIELDS';
type DistanceFunctionType = 'DISTANCE';
type DateFunctionType =
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

const isNormalFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(
        ctx.AVG() ||
        ctx.COUNT_DISTINCT() ||
        ctx.MIN() ||
        ctx.MAX() ||
        ctx.SUM() ||
        ctx.TOLABEL() ||
        ctx.GROUPING() ||
        ctx.CONVERT_CURRENCY(),
    );
};

const isFormatFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(ctx.FORMAT());
};

const isCountFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(ctx.COUNT());
};

const isFieldsFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(ctx.FIELDS());
};

const isDistanceFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(ctx.DISTANCE());
};

const isDateFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return Boolean(
        ctx.CALENDAR_MONTH() ||
        ctx.CALENDAR_QUARTER() ||
        ctx.CALENDAR_YEAR() ||
        ctx.DAY_IN_MONTH() ||
        ctx.DAY_IN_WEEK() ||
        ctx.DAY_IN_YEAR() ||
        ctx.DAY_ONLY() ||
        ctx.FISCAL_MONTH() ||
        ctx.FISCAL_QUARTER() ||
        ctx.FISCAL_YEAR() ||
        ctx.HOUR_IN_DAY() ||
        ctx.WEEK_IN_MONTH() ||
        ctx.WEEK_IN_YEAR(),
    );
};

type SoqlFunctionValueType =
    | NormalSoqlFunctionType
    | CountFunctionType
    | FormatFunctionType
    | FieldsFunctionType
    | DistanceFunctionType
    | DateFunctionType;

type SoqlParameterType =
    | FieldNameTypeClass
    | DateFieldNameTypeClass
    | SoqlFieldsParameterTypeClass
    | (LocationValueTypeClass | ErrorTypeClass | string | string[])[]
    | SoqlFunctionTypeClass;

export class SoqlFunctionTypeClass extends QueryTypeClass<SoqlFunctionValueType> {
    private param: SoqlParameterType | ErrorTypeClass | null = null;

    private constructor(
        value: SoqlFunctionValueType | ErrorTypeClass,
        param: SoqlParameterType | ErrorTypeClass | null,
    ) {
        super('soqlFunction', value);
        this.param = param;
    }

    static create(ctx: SoqlFunctionContext): SoqlFunctionTypeClass {
        if (
            !isNormalFunctionType(ctx) &&
            !isFormatFunctionType(ctx) &&
            !isCountFunctionType(ctx) &&
            !isFieldsFunctionType(ctx) &&
            !isDistanceFunctionType(ctx) &&
            !isDateFunctionType(ctx)
        ) {
            throw new Error('値が異常です。SoqlFunctionContext: ' + ctx.getText());
        }

        let value: SoqlFunctionValueType | ErrorTypeClass;
        let param: SoqlParameterType | ErrorTypeClass | null = null;

        if (isNormalFunctionType(ctx)) {
            if (ctx.AVG()) {
                value = 'AVG';
            } else if (ctx.COUNT_DISTINCT()) {
                value = 'COUNT_DISTINCT';
            } else if (ctx.MIN()) {
                value = 'MIN';
            } else if (ctx.MAX()) {
                value = 'MAX';
            } else if (ctx.SUM()) {
                value = 'SUM';
            } else if (ctx.TOLABEL()) {
                value = 'TOLABEL';
            } else if (ctx.GROUPING()) {
                value = 'GROUPING';
            } else {
                value = 'CONVERT_CURRENCY';
            }

            param = isValidClass(
                new NameVisitor().visit(ctx.fieldName()),
                isFieldNameType,
                'fieldName',
            );
        } else if (isDateFunctionType(ctx)) {
            if (ctx.CALENDAR_MONTH()) {
                value = 'CALENDAR_MONTH';
            } else if (ctx.CALENDAR_QUARTER()) {
                value = 'CALENDAR_QUARTER';
            } else if (ctx.CALENDAR_YEAR()) {
                value = 'CALENDAR_YEAR';
            } else if (ctx.DAY_IN_MONTH()) {
                value = 'DAY_IN_MONTH';
            } else if (ctx.DAY_IN_WEEK()) {
                value = 'DAY_IN_WEEK';
            } else if (ctx.DAY_IN_YEAR()) {
                value = 'DAY_IN_YEAR';
            } else if (ctx.DAY_ONLY()) {
                value = 'DAY_ONLY';
            } else if (ctx.FISCAL_MONTH()) {
                value = 'FISCAL_MONTH';
            } else if (ctx.FISCAL_QUARTER()) {
                value = 'FISCAL_QUARTER';
            } else if (ctx.FISCAL_YEAR()) {
                value = 'FISCAL_YEAR';
            } else if (ctx.HOUR_IN_DAY()) {
                value = 'HOUR_IN_DAY';
            } else if (ctx.WEEK_IN_MONTH()) {
                value = 'WEEK_IN_MONTH';
            } else {
                value = 'WEEK_IN_YEAR';
            }

            param = isValidClass(
                new NameVisitor().visit(ctx.dateFieldName()),
                isDateFieldNameType,
                'dateFieldName',
            );
        } else if (isCountFunctionType(ctx)) {
            value = 'COUNT';

            if (ctx.fieldName()) {
                param = isValidClass(
                    new NameVisitor().visit(ctx.fieldName()),
                    isFieldNameType,
                    'fieldName',
                );
            }
        } else if (isFormatFunctionType(ctx)) {
            value = 'FORMAT';

            if (ctx.fieldName()) {
                param = isValidClass(
                    new NameVisitor().visit(ctx.fieldName()),
                    isFieldNameType,
                    'fieldName',
                );
            }

            if (ctx.soqlFunction()) {
                param = isValidClass(
                    new QueryVisitor().visit(ctx.soqlFunction()),
                    isSoqlFunctionType,
                    'soqlFunction',
                );
            }
        } else if (isFieldsFunctionType(ctx)) {
            value = 'FIELDS';

            param = isValidClass(
                new QueryVisitor().visit(ctx.soqlFunction()),
                isSoqlFunctionType,
                'soqlFunction',
            );
        } else {
            value = 'DISTANCE';

            const distanceParam: (LocationValueTypeClass | ErrorTypeClass | string | string[])[] =
                [];

            distanceParam.push(
                ...isValidClassList(
                    ctx.locationValue_list() || [],
                    (ctx) => new ValueVisitor().visit(ctx),
                    isLocationValueType,
                    'locationValue',
                ),
            );

            if (ctx.StringLiteral()) {
                distanceParam.push(ctx.StringLiteral().getText());
            } else if (ctx.MultilineStringLiteral()) {
                distanceParam.push(ctx.MultilineStringLiteral().getText().split('\n'));
            }
            param = distanceParam;
        }

        return new SoqlFunctionTypeClass(value, param);
    }

    getParam(): SoqlParameterType | ErrorTypeClass | null {
        return this.param;
    }
}

export const isSoqlFunctionType = (target: CommonTypeClass): target is SoqlFunctionTypeClass => {
    return target instanceof SoqlFunctionTypeClass;
};
