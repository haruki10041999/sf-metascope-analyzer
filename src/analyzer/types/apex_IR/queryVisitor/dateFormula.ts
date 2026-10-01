import { DateFormulaContext } from '@apexdevtools/apex-parser';

import { QueryTypeClass } from '../queryVisitor';

import { SignedIntegerTypeClass, LiteralVisitor, isSignedIntegerType } from '../literalVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

type DateFormulaFunctionType =
    | 'YESTERDAY'
    | 'TODAY'
    | 'TOMORROW'
    | 'LAST_WEEK'
    | 'THIS_WEEK'
    | 'NEXT_WEEK'
    | 'LAST_MONTH'
    | 'THIS_MONTH'
    | 'NEXT_MONTH'
    | 'LAST_90_DAYS'
    | 'NEXT_90_DAYS'
    | 'THIS_QUARTER'
    | 'LAST_QUARTER'
    | 'NEXT_QUARTER'
    | 'THIS_YEAR'
    | 'LAST_YEAR'
    | 'NEXT_YEAR'
    | 'THIS_FISCAL_QUARTER'
    | 'LAST_FISCAL_QUARTER'
    | 'NEXT_FISCAL_QUARTER'
    | 'THIS_FISCAL_YEAR'
    | 'LAST_FISCAL_YEAR'
    | 'NEXT_FISCAL_YEAR';

type DateFormulaWithFunctionType =
    | 'LAST_N_DAYS_N'
    | 'NEXT_N_DAYS_N'
    | 'N_DAYS_AGO_N'
    | 'NEXT_N_WEEKS_N'
    | 'LAST_N_WEEKS_N'
    | 'N_WEEKS_AGO_N'
    | 'NEXT_N_MONTHS_N'
    | 'LAST_N_MONTHS_N'
    | 'N_MONTHS_AGO_N'
    | 'NEXT_N_QUARTERS_N'
    | 'LAST_N_QUARTERS_N'
    | 'N_QUARTERS_AGO_N'
    | 'NEXT_N_FISCAL_QUARTERS_N'
    | 'LAST_N_FISCAL_QUARTERS_N'
    | 'N_FISCAL_QUARTERS_AGO_N'
    | 'NEXT_N_YEARS_N'
    | 'LAST_N_YEARS_N'
    | 'N_YEARS_AGO_N'
    | 'NEXT_N_FISCAL_YEARS_N'
    | 'LAST_N_FISCAL_YEARS_N'
    | 'N_FISCAL_YEARS_AGO_N';

const isDateFormulaFunctionType = (ctx: DateFormulaContext): boolean => {
    return Boolean(
        ctx.YESTERDAY() ||
        ctx.TODAY() ||
        ctx.TOMORROW() ||
        ctx.LAST_WEEK() ||
        ctx.THIS_WEEK() ||
        ctx.NEXT_WEEK() ||
        ctx.LAST_MONTH() ||
        ctx.THIS_MONTH() ||
        ctx.NEXT_MONTH() ||
        ctx.LAST_90_DAYS() ||
        ctx.NEXT_90_DAYS() ||
        ctx.THIS_QUARTER() ||
        ctx.LAST_QUARTER() ||
        ctx.NEXT_QUARTER() ||
        ctx.THIS_YEAR() ||
        ctx.LAST_YEAR() ||
        ctx.NEXT_YEAR() ||
        ctx.THIS_FISCAL_QUARTER() ||
        ctx.LAST_FISCAL_QUARTER() ||
        ctx.NEXT_FISCAL_QUARTER() ||
        ctx.THIS_FISCAL_YEAR() ||
        ctx.LAST_FISCAL_YEAR() ||
        ctx.NEXT_FISCAL_YEAR(),
    );
};

const isDateFormulaWithFunctionType = (ctx: DateFormulaContext): boolean => {
    return Boolean(
        ctx.LAST_N_DAYS_N() ||
        ctx.NEXT_N_DAYS_N() ||
        ctx.N_DAYS_AGO_N() ||
        ctx.NEXT_N_WEEKS_N() ||
        ctx.LAST_N_WEEKS_N() ||
        ctx.N_WEEKS_AGO_N() ||
        ctx.NEXT_N_MONTHS_N() ||
        ctx.LAST_N_MONTHS_N() ||
        ctx.N_MONTHS_AGO_N() ||
        ctx.NEXT_N_QUARTERS_N() ||
        ctx.LAST_N_QUARTERS_N() ||
        ctx.N_QUARTERS_AGO_N() ||
        ctx.NEXT_N_FISCAL_QUARTERS_N() ||
        ctx.LAST_N_FISCAL_QUARTERS_N() ||
        ctx.N_FISCAL_QUARTERS_AGO_N() ||
        ctx.NEXT_N_YEARS_N() ||
        ctx.LAST_N_YEARS_N() ||
        ctx.N_YEARS_AGO_N() ||
        ctx.NEXT_N_FISCAL_YEARS_N() ||
        ctx.LAST_N_FISCAL_YEARS_N() ||
        ctx.N_FISCAL_YEARS_AGO_N(),
    );
};

export type DateFormulaValueType = DateFormulaFunctionType | DateFormulaWithFunctionType;

export class DateFormulaTypeClass extends QueryTypeClass<DateFormulaValueType> {
    private param: SignedIntegerTypeClass | null = null;

    private constructor(
        value: DateFormulaValueType | null,
        param: SignedIntegerTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('dateFormula', value, errorClasses);
        this.param = param;
    }

    static create(ctx: DateFormulaContext): DateFormulaTypeClass {
        if (!isDateFormulaFunctionType(ctx) && !isDateFormulaWithFunctionType(ctx)) {
            throw new Error('値が異常です。DateFormulaContext: ' + ctx.getText());
        }

        let value: DateFormulaValueType | null = null;
        let param: SignedIntegerTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (isDateFormulaFunctionType(ctx)) {
            if (ctx.YESTERDAY()) {
                value = 'YESTERDAY';
            }
            if (ctx.TODAY()) {
                value = 'TODAY';
            }
            if (ctx.TOMORROW()) {
                value = 'TOMORROW';
            }
            if (ctx.LAST_WEEK()) {
                value = 'LAST_WEEK';
            }
            if (ctx.THIS_WEEK()) {
                value = 'THIS_WEEK';
            }
            if (ctx.NEXT_WEEK()) {
                value = 'NEXT_WEEK';
            }
            if (ctx.LAST_MONTH()) {
                value = 'LAST_MONTH';
            }
            if (ctx.THIS_MONTH()) {
                value = 'THIS_MONTH';
            }
        }
        if (ctx.NEXT_MONTH()) {
            value = 'NEXT_MONTH';
        }
        if (ctx.LAST_90_DAYS()) {
            value = 'LAST_90_DAYS';
        }
        if (ctx.NEXT_90_DAYS()) {
            value = 'NEXT_90_DAYS';
        }
        if (ctx.THIS_QUARTER()) {
            value = 'THIS_QUARTER';
        }
        if (ctx.LAST_QUARTER()) {
            value = 'LAST_QUARTER';
        }
        if (ctx.NEXT_QUARTER()) {
            value = 'NEXT_QUARTER';
        }
        if (ctx.THIS_YEAR()) {
            value = 'THIS_YEAR';
        }
        if (ctx.LAST_YEAR()) {
            value = 'LAST_YEAR';
        }
        if (ctx.NEXT_YEAR()) {
            value = 'NEXT_YEAR';
        }
        if (ctx.THIS_FISCAL_QUARTER()) {
            value = 'THIS_FISCAL_QUARTER';
        }
        if (ctx.LAST_FISCAL_QUARTER()) {
            value = 'LAST_FISCAL_QUARTER';
        }
        if (ctx.NEXT_FISCAL_QUARTER()) {
            value = 'NEXT_FISCAL_QUARTER';
        }
        if (ctx.THIS_FISCAL_YEAR()) {
            value = 'THIS_FISCAL_YEAR';
        }
        if (ctx.LAST_FISCAL_YEAR()) {
            value = 'LAST_FISCAL_YEAR';
        }
        if (ctx.NEXT_FISCAL_YEAR()) {
            value = 'NEXT_FISCAL_YEAR';
        }

        if (isDateFormulaWithFunctionType(ctx)) {
            const literalTypeClass = new LiteralVisitor().visit(ctx.signedInteger());
            if (isSignedIntegerType(literalTypeClass)) {
                param = literalTypeClass;
            } else if (isErrorType(literalTypeClass)) {
                errorClasses['param'] = literalTypeClass;
            }

            if (ctx.LAST_N_DAYS_N()) {
                value = 'LAST_N_DAYS_N';
            }
            if (ctx.NEXT_N_DAYS_N()) {
                value = 'NEXT_N_DAYS_N';
            }
            if (ctx.N_DAYS_AGO_N()) {
                value = 'N_DAYS_AGO_N';
            }
            if (ctx.NEXT_N_WEEKS_N()) {
                value = 'NEXT_N_WEEKS_N';
            }
            if (ctx.LAST_N_WEEKS_N()) {
                value = 'LAST_N_WEEKS_N';
            }
            if (ctx.N_WEEKS_AGO_N()) {
                value = 'N_WEEKS_AGO_N';
            }
            if (ctx.NEXT_N_MONTHS_N()) {
                value = 'NEXT_N_MONTHS_N';
            }
            if (ctx.LAST_N_MONTHS_N()) {
                value = 'LAST_N_MONTHS_N';
            }
            if (ctx.N_MONTHS_AGO_N()) {
                value = 'N_MONTHS_AGO_N';
            }
            if (ctx.NEXT_N_QUARTERS_N()) {
                value = 'NEXT_N_QUARTERS_N';
            }
            if (ctx.LAST_N_QUARTERS_N()) {
                value = 'LAST_N_QUARTERS_N';
            }
            if (ctx.N_QUARTERS_AGO_N()) {
                value = 'N_QUARTERS_AGO_N';
            }
            if (ctx.NEXT_N_FISCAL_QUARTERS_N()) {
                value = 'NEXT_N_FISCAL_QUARTERS_N';
            }
            if (ctx.LAST_N_FISCAL_QUARTERS_N()) {
                value = 'LAST_N_FISCAL_QUARTERS_N';
            }
            if (ctx.N_FISCAL_QUARTERS_AGO_N()) {
                value = 'N_FISCAL_QUARTERS_AGO_N';
            }
            if (ctx.NEXT_N_YEARS_N()) {
                value = 'NEXT_N_YEARS_N';
            }
            if (ctx.LAST_N_YEARS_N()) {
                value = 'LAST_N_YEARS_N';
            }
            if (ctx.N_YEARS_AGO_N()) {
                value = 'N_YEARS_AGO_N';
            }
            if (ctx.NEXT_N_FISCAL_YEARS_N()) {
                value = 'NEXT_N_FISCAL_YEARS_N';
            }
            if (ctx.LAST_N_FISCAL_YEARS_N()) {
                value = 'LAST_N_FISCAL_YEARS_N';
            }
            if (ctx.N_FISCAL_YEARS_AGO_N()) {
                value = 'N_FISCAL_YEARS_AGO_N';
            }
        }

        return new DateFormulaTypeClass(value, param, errorClasses);
    }

    getParam(): SignedIntegerTypeClass | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }
}

export const isDateFormulaType = (target: CommonTypeClass): target is DateFormulaTypeClass => {
    return target instanceof DateFormulaTypeClass;
};

