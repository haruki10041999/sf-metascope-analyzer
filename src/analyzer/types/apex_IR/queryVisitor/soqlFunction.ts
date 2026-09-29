import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import { QueryType, QueryVisitor } from '.';

import { NameType, NameVisitor } from '../nameVisitor';
import { ParameterType, ParameterVisitor } from '../parameterVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';

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

type SoqlFunctionFieldType =
    | {
          functionType: NormalSoqlFunctionType;
          name: NameType;
      }
    | {
          functionType: DateFunctionType;
          name: NameType;
      }
    | {
          functionType: CountFunctionType;
          name?: NameType;
      }
    | {
          functionType: FormatFunctionType;
          name: NameType;
          format?: string;
      }
    | {
          functionType: FieldsFunctionType;
          param: ParameterType;
      }
    | {
          functionType: DistanceFunctionType;
          param: ValueType[];
      };

export type SoqlFunctionType = {
    type: 'soqlFunction';
    query: SoqlFunctionFieldType;
};

export const makeSoqlFunctionType = (ctx: SoqlFunctionContext): SoqlFunctionType => {
    let functionName:
        | NormalSoqlFunctionType
        | FormatFunctionType
        | CountFunctionType
        | FieldsFunctionType
        | DistanceFunctionType
        | DateFunctionType
        | undefined = undefined;
    if (isNormalFunctionType(ctx)) {
        const name = new NameVisitor().visit(ctx.fieldName());

        if (ctx.AVG()) {
            functionName = 'AVG';
        }
        if (ctx.COUNT_DISTINCT()) {
            functionName = 'COUNT_DISTINCT';
        }
        if (ctx.MIN()) {
            functionName = 'MIN';
        }
        if (ctx.MAX()) {
            functionName = 'MAX';
        }
        if (ctx.SUM()) {
            functionName = 'SUM';
        }
        if (ctx.TOLABEL()) {
            functionName = 'TOLABEL';
        }
        if (ctx.GROUPING()) {
            functionName = 'GROUPING';
        }
        if (ctx.CONVERT_CURRENCY()) {
            functionName = 'CONVERT_CURRENCY';
        }

        if (functionName) {
            return {
                type: 'soqlFunction',
                query: {
                    functionType: functionName,
                    name: name,
                },
            };
        }
    }

    if (isDateFunctionType(ctx)) {
        const name = new NameVisitor().visit(ctx.dateFieldName());

        if (ctx.CALENDAR_MONTH()) {
            functionName = 'CALENDAR_MONTH';
        }
        if (ctx.CALENDAR_QUARTER()) {
            functionName = 'CALENDAR_QUARTER';
        }
        if (ctx.CALENDAR_YEAR()) {
            functionName = 'CALENDAR_YEAR';
        }
        if (ctx.DAY_IN_MONTH()) {
            functionName = 'DAY_IN_MONTH';
        }
        if (ctx.DAY_IN_WEEK()) {
            functionName = 'DAY_IN_WEEK';
        }
        if (ctx.DAY_IN_YEAR()) {
            functionName = 'DAY_IN_YEAR';
        }
        if (ctx.DAY_ONLY()) {
            functionName = 'DAY_ONLY';
        }
        if (ctx.FISCAL_MONTH()) {
            functionName = 'FISCAL_MONTH';
        }
        if (ctx.FISCAL_QUARTER()) {
            functionName = 'FISCAL_QUARTER';
        }
        if (ctx.FISCAL_YEAR()) {
            functionName = 'FISCAL_YEAR';
        }
        if (ctx.HOUR_IN_DAY()) {
            functionName = 'HOUR_IN_DAY';
        }
        if (ctx.WEEK_IN_MONTH()) {
            functionName = 'WEEK_IN_MONTH';
        }
        if (ctx.WEEK_IN_YEAR()) {
            functionName = 'WEEK_IN_YEAR';
        }

        if (functionName) {
            return {
                type: 'soqlFunction',
                query: {
                    functionType: functionName,
                    name: name,
                },
            };
        }
    }

    if (isCountFunctionType(ctx)) {
        const query: {
            functionType: CountFunctionType;
            name?: NameType;
        } = {
            functionType: 'COUNT',
        };

        if (ctx.fieldName()) {
            const name = new NameVisitor().visit(ctx.fieldName());
            query.name = name;
        }

        return {
            type: 'soqlFunction',
            query: query,
        };
    }

    if (isFormatFunctionType(ctx)) {
        const name = new NameVisitor().visit(ctx.fieldName());
        const query: {
            functionType: FormatFunctionType;
            name: NameType;
            format?: string;
        } = {
            functionType: 'FORMAT',
            name: name,
        };

        if (ctx.StringLiteral()) {
            query.format = ctx.StringLiteral().getText();
        }

        if (ctx.MultilineStringLiteral()) {
            query.format = ctx.MultilineStringLiteral().getText();
        }

        return {
            type: 'soqlFunction',
            query: query,
        };
    }

    if (isFieldsFunctionType(ctx)) {
        const param = new ParameterVisitor().visit(ctx.soqlFieldsParameter());
        return {
            type: 'soqlFunction',
            query: {
                functionType: 'FIELDS',
                param: param,
            },
        };
    }

    if (isDistanceFunctionType(ctx)) {
        const param = ctx.locationValue_list().map((laocationValueCtx) => {
            const value = new ValueVisitor().visit(laocationValueCtx);
            return value;
        });

        return {
            type: 'soqlFunction',
            query: {
                functionType: 'DISTANCE',
                param: param,
            },
        };
    }

    if (ctx.soqlFunction()) {
        const soqlFunction = new QueryVisitor().visit(ctx.soqlFunction());
        if (soqlFunction.type === 'soqlFunction') {
            return {
                type: 'soqlFunction',
                query: soqlFunction.query,
            };
        }
    }

    throw new Error('値が異常です。SoqlFunctionContext: ' + ctx.getText());
};
