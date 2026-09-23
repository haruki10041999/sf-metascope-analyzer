import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { ParamField, makeParamList } from './apex/params';
import { StatementField, makeStatementField } from './apex/statement';

export type ConstructorField = {
    name: string;
    params: ParamField[];
    blockStatement: StatementField[];
};

export const makeConstructorField = (ctx: ConstructorDeclarationContext): ConstructorField => {
    return {
        name: ctx.qualifiedName().getText(),
        params: makeParamList(ctx.formalParameters()),
        blockStatement: ctx
            .block()
            .statement_list()
            .map((StatementCtx) => {
                return makeStatementField(StatementCtx);
            }),
    };
};
