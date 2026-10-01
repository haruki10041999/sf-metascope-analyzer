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
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

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
    | (LocationValueTypeClass | string | string[])[]
    | SoqlFunctionTypeClass;

export class SoqlFunctionTypeClass extends QueryTypeClass<SoqlFunctionValueType> {
    private param: SoqlParameterType | null = null;

    private constructor(
        value: SoqlFunctionValueType | null,
        param: SoqlParameterType | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('soqlFunction', value, errorClasses);
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

        let value: SoqlFunctionValueType | null = null;
        let param: SoqlParameterType | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (isNormalFunctionType(ctx)) {
            if (ctx.AVG()) {
                value = 'AVG';
            }
            if (ctx.COUNT_DISTINCT()) {
                value = 'COUNT_DISTINCT';
            }
            if (ctx.MIN()) {
                value = 'MIN';
            }
            if (ctx.MAX()) {
                value = 'MAX';
            }
            if (ctx.SUM()) {
                value = 'SUM';
            }
            if (ctx.TOLABEL()) {
                value = 'TOLABEL';
            }
            if (ctx.GROUPING()) {
                value = 'GROUPING';
            }
            if (ctx.CONVERT_CURRENCY()) {
                value = 'CONVERT_CURRENCY';
            }

            const nameTypeClass = new NameVisitor().visit(ctx.fieldName());
            if (isFieldNameType(nameTypeClass)) {
                param = nameTypeClass;
            } else if (isErrorType(nameTypeClass)) {
                errorClasses['param'] = nameTypeClass;
            }
        }

        if (isDateFunctionType(ctx)) {
            if (ctx.CALENDAR_MONTH()) {
                value = 'CALENDAR_MONTH';
            }
            if (ctx.CALENDAR_QUARTER()) {
                value = 'CALENDAR_QUARTER';
            }
            if (ctx.CALENDAR_YEAR()) {
                value = 'CALENDAR_YEAR';
            }
            if (ctx.DAY_IN_MONTH()) {
                value = 'DAY_IN_MONTH';
            }
            if (ctx.DAY_IN_WEEK()) {
                value = 'DAY_IN_WEEK';
            }
            if (ctx.DAY_IN_YEAR()) {
                value = 'DAY_IN_YEAR';
            }
            if (ctx.DAY_ONLY()) {
                value = 'DAY_ONLY';
            }
            if (ctx.FISCAL_MONTH()) {
                value = 'FISCAL_MONTH';
            }
            if (ctx.FISCAL_QUARTER()) {
                value = 'FISCAL_QUARTER';
            }
            if (ctx.FISCAL_YEAR()) {
                value = 'FISCAL_YEAR';
            }
            if (ctx.HOUR_IN_DAY()) {
                value = 'HOUR_IN_DAY';
            }
            if (ctx.WEEK_IN_MONTH()) {
                value = 'WEEK_IN_MONTH';
            }
            if (ctx.WEEK_IN_YEAR()) {
                value = 'WEEK_IN_YEAR';
            }

            const nameTypeClass = new NameVisitor().visit(ctx.dateFieldName());
            if (isDateFieldNameType(nameTypeClass)) {
                param = nameTypeClass;
            } else if (isErrorType(nameTypeClass)) {
                errorClasses['param'] = nameTypeClass;
            }
        }

        if (isCountFunctionType(ctx)) {
            value = 'COUNT';

            if (ctx.fieldName()) {
                const nameTypeClass = new NameVisitor().visit(ctx.fieldName());
                if (isFieldNameType(nameTypeClass)) {
                    param = nameTypeClass;
                } else if (isErrorType(nameTypeClass)) {
                    errorClasses['param'] = nameTypeClass;
                } else {
                }
            }
        }

        if (isFormatFunctionType(ctx)) {
            value = 'FORMAT';

            if (ctx.fieldName()) {
                const nameTypeClass = new NameVisitor().visit(ctx.fieldName());
                if (isFieldNameType(nameTypeClass)) {
                    param = nameTypeClass;
                } else if (isErrorType(nameTypeClass)) {
                    errorClasses['param'] = nameTypeClass;
                }
            }

            if (ctx.soqlFunction()) {
                const queryTypeClass = new QueryVisitor().visit(ctx.soqlFunction());
                if (isSoqlFunctionType(queryTypeClass)) {
                    param = queryTypeClass;
                } else if (isErrorType(queryTypeClass)) {
                    errorClasses['param'] = queryTypeClass;
                }
            }
        }

        if (isFieldsFunctionType(ctx)) {
            value = 'FIELDS';

            const paramTypeClass = new ParameterVisitor().visit(ctx.soqlFieldsParameter());
            if (isSoqlFieldsParameterType(paramTypeClass)) {
                param = paramTypeClass;
            } else if (isErrorType(paramTypeClass)) {
                errorClasses['param'] = paramTypeClass;
            }
        }

        if (isDistanceFunctionType(ctx)) {
            value = 'DISTANCE';

            const distanceParam: (LocationValueTypeClass | string | string[])[] = [];

            ctx.locationValue_list().forEach((locationValueCtx, index) => {
                const valueTypeClass = new ValueVisitor().visit(locationValueCtx);
                if (isLocationValueType(valueTypeClass)) {
                    distanceParam.push(valueTypeClass);
                } else if (isErrorType(valueTypeClass)) {
                    errorClasses[`param_${index}`] = valueTypeClass;
                }
            });

            if (ctx.StringLiteral()) {
                distanceParam.push(ctx.StringLiteral().getText());
            }

            if (ctx.MultilineStringLiteral()) {
                distanceParam.push(ctx.MultilineStringLiteral().getText().split('\n'));
            }
            param = distanceParam;
        }

        return new SoqlFunctionTypeClass(value, param, errorClasses);
    }

    getParam(): SoqlParameterType | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }
}

export const isSoqlFunctionType = (target: CommonTypeClass): target is SoqlFunctionTypeClass => {
    return target instanceof SoqlFunctionTypeClass;
};

