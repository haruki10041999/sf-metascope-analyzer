import { MethodDeclarationContext } from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from '../type';
import { ParamField, makeParamList } from '../params';
import { StatementField, makeStatementField } from '../statement';

export type MethodMemberType = {
    type: 'method';
    name: string;
    returnType: 'void' | TypeField;
    params: ParamField[];
    blockStatement?: StatementField[];
};

export const makeMethodMemberType = (ctx: MethodDeclarationContext): MethodMemberType => {
    const name = ctx.id().getText();

    let returnType: 'void' | TypeField;
    if (ctx.VOID()) {
        returnType = 'void';
    } else {
        returnType = makeTypeField(ctx.typeRef());
    }

    const methodField: MethodMemberType = {
        type: 'method',
        name: name,
        returnType: returnType,
        params: makeParamList(ctx.formalParameters()),
    };

    if (ctx.block()) {
        methodField.blockStatement = ctx
            .block()
            .statement_list()
            .map((statementCtx) => {
                return makeStatementField(statementCtx);
            });
    }

    return methodField;
};

