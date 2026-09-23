import {
    MethodDeclarationContext,
    FormalParametersContext,
    FormalParameterListContext,
    FormalParameterContext,
} from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from './type';
import { ModifierField, makeModifierField } from './modifer';
import { StatementField, makeStatementField } from './statement';

export type MethodField = {
    name: string;
    returnType: 'void' | TypeField;
    params: {
        variantType: TypeField;
        variant: string;
        modifier?: ModifierField[];
    }[];
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

    const params: {
        variantType: TypeField;
        variant: string;
        modifier?: ModifierField[];
    }[] = [];
    ctx.formalParameters()
        .formalParameterList()
        .formalParameter_list()
        .forEach((formalParameterCtx) => {
            const variantType = makeTypeField(formalParameterCtx.typeRef());
            const variant = formalParameterCtx.id().getText();

            const param: {
                variantType: TypeField;
                variant: string;
                modifier?: ModifierField[];
            } = {
                variantType: variantType,
                variant: variant,
            };
            if (
                formalParameterCtx.modifier_list() &&
                formalParameterCtx.modifier_list().length > 0
            ) {
                param.modifier = formalParameterCtx.modifier_list().map((modifierCtx) => {
                    return makeModifierField(modifierCtx);
                });
            }
            params.push(param);
        });

    const methodField: MethodField = {
        name: name,
        returnType: returnType,
        params: params,
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
