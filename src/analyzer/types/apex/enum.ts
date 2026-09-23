import { EnumDeclarationContext, EnumConstantsContext } from '@apexdevtools/apex-parser';

export type EnumField = {
    variant: string;
    constants: string[];
};

export const makeEnumField = (ctx: EnumDeclarationContext): EnumField => {
    return {
        variant: ctx.id().getText(),
        constants: ctx
            .enumConstants()
            .id_list()
            .map((idCtx) => idCtx.getText()),
    };
};
