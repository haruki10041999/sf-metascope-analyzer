import { EnumDeclarationContext, EnumConstantsContext } from '@apexdevtools/apex-parser';

export type EnumMemberType = {
    type: 'enum';
    variant: string;
    constants: string[];
};

export const makeEnumMemberType = (ctx: EnumDeclarationContext): EnumMemberType => {
    return {
        type: 'enum',
        variant: ctx.id().getText(),
        constants: ctx
            .enumConstants()
            .id_list()
            .map((idCtx) => idCtx.getText()),
    };
};

