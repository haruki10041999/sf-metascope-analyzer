import {
    WithClauseContext,
    FilteringExpressionContext,
    DataCategorySelectionContext,
    DataCategoryNameContext,
    SoqlIdContext,
    FilteringSelectorContext,
} from '@apexdevtools/apex-parser';

type DataCategoryOperator = 'AT' | 'ABOVE' | 'BELOW' | 'ABOVE_OR_BELOW';

export type DataCategoryField =
    | {
          type: 'condition';
          field: string;
          operator: DataCategoryOperator;
          categories: string[];
      }
    | {
          type: 'AND';
          condition1: DataCategoryField;
          condition2: DataCategoryField;
      };

export type WithField =
    | {
          type: 'SECURITY_ENFORCED' | 'SYSTEM_MODE' | 'USER_MODE' | 'NONE';
      }
    | {
          type: 'DATA_CATEGORY';
          condition: DataCategoryField;
      };

export const makeWithField = (ctx: WithClauseContext): WithField => {
    if (ctx.DATA() && ctx.CATEGORY() && ctx.filteringExpression()) {
        const filteringExpressionCtx = ctx.filteringExpression();

        const dataCategorySelectionCtxs = filteringExpressionCtx.dataCategorySelection_list();
        const andNodes = filteringExpressionCtx.SOQLAND_list();

        if (
            dataCategorySelectionCtxs.length === 0 ||
            dataCategorySelectionCtxs.length - 1 !== andNodes.length
        ) {
            throw new Error(`WithClauseContext:${ctx.getText()}`);
        }

        const conditions: DataCategoryField[] = [];
        dataCategorySelectionCtxs.forEach((dataCategorySelectionCtx) => {
            const field: string = dataCategorySelectionCtx.soqlId().getText();
            const operator = makeDataCategoryOperator(dataCategorySelectionCtx.filteringSelector());

            const dataCategoryNameCtx: DataCategoryNameContext =
                dataCategorySelectionCtx.dataCategoryName();

            const categories = dataCategoryNameCtx.soqlId_list().map((soqlId: SoqlIdContext) => {
                return soqlId.getText();
            });

            conditions.push({
                type: 'condition',
                field: field,
                operator: operator,
                categories: categories,
            });
        });

        let categoryField = conditions[0]!;

        for (let i = 1; i < conditions.length; i++) {
            categoryField = {
                type: 'AND',
                condition1: categoryField,
                condition2: conditions[i]!,
            };
        }

        return {
            type: 'DATA_CATEGORY',
            condition: categoryField,
        };
    }

    let type: 'SECURITY_ENFORCED' | 'SYSTEM_MODE' | 'USER_MODE' | 'NONE' = 'NONE';
    if (ctx.SECURITY_ENFORCED()) {
        type = 'SECURITY_ENFORCED';
    }

    if (ctx.SYSTEM_MODE()) {
        type = 'SYSTEM_MODE';
    }

    if (ctx.USER_MODE()) {
        type = 'USER_MODE';
    }

    return {
        type: type,
    };
};

const makeDataCategoryOperator = (ctx: FilteringSelectorContext): DataCategoryOperator => {
    if (ctx.AT()) {
        return 'AT';
    }

    if (ctx.ABOVE()) {
        return 'ABOVE';
    }

    if (ctx.BELOW()) {
        return 'BELOW';
    }

    if (ctx.ABOVE_OR_BELOW()) {
        return 'ABOVE_OR_BELOW';
    }

    throw new Error(`値が異常です。FilteringSelectorContext:${ctx.getText()}`);
};
