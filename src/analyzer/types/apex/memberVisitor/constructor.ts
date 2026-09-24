import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { ParamField, makeParamList } from '../params';
import { StatementField, makeStatementField } from '../statementVisitor';

export type ConstructorMemberType = {
    type: 'constructor';
    name: string;
    params: ParamField[];
    blockStatement: StatementField[];
};

export const makeConstructorMemberType = (
    ctx: ConstructorDeclarationContext,
): ConstructorMemberType => {
    return {
        type: 'constructor',
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
