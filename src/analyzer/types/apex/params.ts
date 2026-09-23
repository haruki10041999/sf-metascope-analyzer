import {
    FormalParameterListContext,
    FormalParametersContext,
    FormalParameterContext,
} from '@apexdevtools/apex-parser';

import { TypeField, makeTypeField } from './type';
import { ModifierField, makeModifierField } from './modifer';

export type ParamField = {
    variantType: TypeField;
    variant: string;
    modifier?: ModifierField[];
};

export const makeParamList = (ctx: FormalParametersContext): ParamField[] => {
    return ctx
        .formalParameterList()
        .formalParameter_list()
        .map((formalParameterCtx) => {
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

            return param;
        });
};
