import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type FormalParameterType = {
    type: 'formalParameter';
    parameter: {
        parameter: IdType;
        type?: TypeType;
        modifier?: ModifierType[];
    };
};

export const makeFormalParameterType = (ctx: FormalParameterContext): FormalParameterType => {
    const param = new IdVisitor().visit(ctx.id());

    const formalParameterType: FormalParameterType = {
        type: 'formalParameter',
        parameter: {
            parameter: param,
        },
    };

    if (ctx.modifier_list() && ctx.modifier_list.length > 0) {
        formalParameterType.parameter.modifier = ctx
            .modifier_list()
            .map((modifierCtx) => new ModifierVisitor().visit(modifierCtx));
    }

    if (ctx.typeRef()) {
        formalParameterType.parameter.type = new TypeVisitor().visit(ctx.typeRef());
    }

    return formalParameterType;
};
