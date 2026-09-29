import { DateFormulaContext } from '@apexdevtools/apex-parser';

import { LiteralVisitor, LiteralType } from '../literalVisitor';

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

export type DateFormulaType = {
    type: 'dateFormula';
    query:
        | {
              formulaFunctionType: DateFormulaFunctionType;
          }
        | {
              formulaFunctionType: DateFormulaWithFunctionType;
              param: LiteralType;
          };
};

export const makeDateFormulaType = (ctx: DateFormulaContext): DateFormulaType => {
    if (isDateFormulaFunctionType(ctx)) {
        if (ctx.YESTERDAY()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'YESTERDAY',
                },
            };
        }
        if (ctx.TODAY()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'TODAY',
                },
            };
        }
        if (ctx.TOMORROW()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'TOMORROW',
                },
            };
        }
        if (ctx.LAST_WEEK()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_WEEK',
                },
            };
        }
        if (ctx.THIS_WEEK()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_WEEK',
                },
            };
        }
        if (ctx.NEXT_WEEK()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_WEEK',
                },
            };
        }
        if (ctx.LAST_MONTH()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_MONTH',
                },
            };
        }
        if (ctx.THIS_MONTH()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_MONTH',
                },
            };
        }
        if (ctx.NEXT_MONTH()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_MONTH',
                },
            };
        }
        if (ctx.LAST_90_DAYS()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_90_DAYS',
                },
            };
        }
        if (ctx.NEXT_90_DAYS()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_90_DAYS',
                },
            };
        }
        if (ctx.THIS_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_QUARTER',
                },
            };
        }
        if (ctx.LAST_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_QUARTER',
                },
            };
        }
        if (ctx.NEXT_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_QUARTER',
                },
            };
        }
        if (ctx.THIS_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_YEAR',
                },
            };
        }
        if (ctx.LAST_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_YEAR',
                },
            };
        }
        if (ctx.NEXT_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_YEAR',
                },
            };
        }
        if (ctx.THIS_FISCAL_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_FISCAL_QUARTER',
                },
            };
        }
        if (ctx.LAST_FISCAL_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_FISCAL_QUARTER',
                },
            };
        }
        if (ctx.NEXT_FISCAL_QUARTER()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_FISCAL_QUARTER',
                },
            };
        }
        if (ctx.THIS_FISCAL_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'THIS_FISCAL_YEAR',
                },
            };
        }
        if (ctx.LAST_FISCAL_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_FISCAL_YEAR',
                },
            };
        }
        if (ctx.NEXT_FISCAL_YEAR()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_FISCAL_YEAR',
                },
            };
        }
    }

    if (isDateFormulaWithFunctionType(ctx)) {
        const param = new LiteralVisitor().visit(ctx.signedInteger());

        if (ctx.LAST_N_DAYS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_DAYS_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_DAYS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_DAYS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_DAYS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_DAYS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_WEEKS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_WEEKS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_WEEKS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_WEEKS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_WEEKS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_WEEKS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_MONTHS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_MONTHS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_MONTHS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_MONTHS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_MONTHS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_MONTHS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_QUARTERS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_QUARTERS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_QUARTERS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_QUARTERS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_QUARTERS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_QUARTERS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_FISCAL_QUARTERS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_FISCAL_QUARTERS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_FISCAL_QUARTERS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_FISCAL_QUARTERS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_FISCAL_QUARTERS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_FISCAL_QUARTERS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_YEARS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_YEARS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_YEARS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_YEARS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_YEARS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_YEARS_AGO_N',
                    param: param,
                },
            };
        }
        if (ctx.NEXT_N_FISCAL_YEARS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'NEXT_N_FISCAL_YEARS_N',
                    param: param,
                },
            };
        }
        if (ctx.LAST_N_FISCAL_YEARS_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'LAST_N_FISCAL_YEARS_N',
                    param: param,
                },
            };
        }
        if (ctx.N_FISCAL_YEARS_AGO_N()) {
            return {
                type: 'dateFormula',
                query: {
                    formulaFunctionType: 'N_FISCAL_YEARS_AGO_N',
                    param: param,
                },
            };
        }
    }

    throw new Error('値が異常です。DateFormulaContext: ' + ctx.getText());
};
