import { SoqlFunctionContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';
import { ParameterType, ParameterVisitor } from './parameterVisitor';
import { ValueType, ValueVisitor } from './valueVisitor';

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
    return (
        ctx.AVG() !== undefined ||
        ctx.COUNT_DISTINCT() !== undefined ||
        ctx.MIN() !== undefined ||
        ctx.MAX() !== undefined ||
        ctx.SUM() !== undefined ||
        ctx.TOLABEL() !== undefined ||
        ctx.GROUPING() !== undefined ||
        ctx.CONVERT_CURRENCY() !== undefined
    );
};

const isFormatFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.FORMAT() !== undefined;
};

const isCountFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.COUNT() !== undefined;
};

const isFieldsFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.FIELDS() !== undefined;
};

const isDistanceFunctionType = (ctx: SoqlFunctionContext): boolean => {
    return ctx.DISTANCE() !== undefined;
};

const isDateFunctionType = (ctx: SoqlFunctionContext): boolean => {
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

export type SoqlFunctionType = {
    type: 'soqlFunction';
} & (
    | {
          functionType: NormalSoqlFunctionType;
          fieldName: Omit<NameType, 'type'>;
      }
    | {
          functionType: DateFunctionType;
          fieldName: Omit<NameType, 'type'>;
      }
    | {
          functionType: CountFunctionType;
          fieldName?: Omit<NameType, 'type'>;
      }
    | {
          functionType: FormatFunctionType;
          fieldName: Omit<NameType, 'type'>;
          format?: string;
      }
    | {
          functionType: FieldsFunctionType;
          param: Omit<ParameterType, 'type'>;
      }
    | {
          functionType: DistanceFunctionType;
          param: Omit<ValueType, 'type'>[];
      }
    | {
          function: Omit<SoqlFunctionType, 'type'>;
      }
);

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
        const { type, ...fieldName } = new NameVisitor().visit(ctx.fieldName());

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
                functionType: functionName,
                fieldName: fieldName,
            };
        }
    }

    if (isDateFunctionType(ctx)) {
        const { type, ...fieldName } = new NameVisitor().visit(ctx.dateFieldName());

        if (ctx.CALENDAR_MONTH()) {
            functionName = 'CALENDAR_MONTH';
        }
        if (ctx.CALENDAR_QUARTER()) {
            functionName = 'CALENDAR_QUARTER';
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
                functionType: functionName,
                fieldName: fieldName,
            };
        }
    }

    if (isCountFunctionType(ctx)) {
        const soqlFunctionType: SoqlFunctionType = {
            type: 'soqlFunction',
            functionType: 'COUNT',
        };

        if (ctx.fieldName()) {
            const { type, ...fieldName } = new NameVisitor().visit(ctx.fieldName());
            soqlFunctionType.fieldName = fieldName;
        }

        return soqlFunctionType;
    }

    if (isFormatFunctionType(ctx)) {
        const { type, ...fieldName } = new NameVisitor().visit(ctx.fieldName());
        const soqlFunctionType: SoqlFunctionType = {
            type: 'soqlFunction',
            functionType: 'FORMAT',
            fieldName: fieldName,
        };

        if (ctx.StringLiteral()) {
            soqlFunctionType.format = ctx.StringLiteral().getText();
        }

        if (ctx.MultilineStringLiteral()) {
            soqlFunctionType.format = ctx.MultilineStringLiteral().getText();
        }

        return soqlFunctionType;
    }

    if (isFieldsFunctionType(ctx)) {
        const { type, ...param } = new ParameterVisitor().visit(ctx.soqlFieldsParameter());
        return {
            type: 'soqlFunction',
            functionType: 'FIELDS',
            param: param,
        };
    }

    if (isDistanceFunctionType(ctx)) {
        const param = ctx.locationValue_list().map((laocationValueCtx) => {
            const { type, ...value } = new ValueVisitor().visit(laocationValueCtx);
            return value;
        });

        return {
            type: 'soqlFunction',
            functionType: 'DISTANCE',
            param: param,
        };
    }

    if (ctx.soqlFunction()) {
        const { type, ...soqlFunction } = makeSoqlFunctionType(ctx.soqlFunction());
        return {
            type: 'soqlFunction',
            function: soqlFunction,
        };
    }

    throw new Error('値が異常です。SoqlFunctionContext: ' + ctx.getText());
};
