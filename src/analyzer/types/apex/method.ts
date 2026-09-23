import {
    MethodDeclarationContext,
    FormalParametersContext,
    FormalParameterListContext,
    FormalParameterContext,
} from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from './type';
import { ParamField, makeParamList } from './params';
import { StatementField, makeStatementField } from './statement';

export type MethodField = {
    name: string;
    returnType: 'void' | TypeField;
    params: ParamField[];
    blockStatment?: StatementField[];
};

export const makeMethodField = (ctx: MethodDeclarationContext): MethodField => {
    const name = ctx.id().getText();

    let returnType: 'void' | TypeField;
    if (ctx.VOID()) {
        returnType = 'void';
    } else {
        returnType = makeTypeField(ctx.typeRef());
    }

    const methodField: MethodField = {
        name: name,
        returnType: returnType,
        params: makeParamList(ctx.formalParameters()),
    };

    if (ctx.block()) {
        methodField.blockStatment = ctx
            .block()
            .statement_list()
            .map((statementCtx) => {
                return makeStatementField(statementCtx);
            });
    }

    return methodField;
};
