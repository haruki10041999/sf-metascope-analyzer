import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

import { ModifierType, makeModifierType } from '../modifier';
import { TypeRefType, makeTypeRefType } from '../typeRef';

export type FormalParameterType = {
    type: 'formalParameter';
    param: Omit<IdType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
    typeRef?: Omit<TypeRefType, 'type'>;
};

export const makeFormalParameterType = (ctx: FormalParameterContext): FormalParameterType => {
    const param = new IdVisitor().visit(ctx.id());

    const formalParameterType: FormalParameterType = {
        type: 'formalParameter',
        param: param,
    };

    if (ctx.modifier_list() && ctx.modifier_list.length > 0) {
        formalParameterType.modifier = ctx
            .modifier_list()
            .map((modifierCtx) => makeModifierType(modifierCtx));
    }

    if (ctx.typeRef()) {
        formalParameterType.typeRef = makeTypeRefType(ctx.typeRef());
    }

    return formalParameterType;
};
