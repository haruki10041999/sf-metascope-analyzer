import { InterfaceMethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

import { TypeRefType, makeTypeRefType } from '../typeRef';
import { FormalParametersType, makeFormalParametersType } from '../formalParameters';
import { ModifierType, makeModifierType } from '../modifier';

export type InterfaceMethodDeclarationType = {
    type: 'InterfaceMethodDeclaration';
    methodName: Omit<IdType, 'type'>;
    returnType: Omit<TypeRefType, 'type'> | 'void';
    params?: Omit<FormalParametersType, 'type'>;
    modifiers?: Omit<ModifierType, 'type'>[];
};

export const makeInterfaceMethodDeclarationType = (
    ctx: InterfaceMethodDeclarationContext,
): InterfaceMethodDeclarationType => {
    const { type, ...methodName } = new IdVisitor().visit(ctx.id());
    const returnType = ctx.typeRef()
        ? (() => {
              const { type, ...returnType } = makeTypeRefType(ctx.typeRef());
              return returnType;
          })()
        : 'void';

    const interfaceMethodDeclarationType: InterfaceMethodDeclarationType = {
        type: 'InterfaceMethodDeclaration',
        methodName,
        returnType,
    };

    if (ctx.formalParameters()) {
        const { type, ...params } = makeFormalParametersType(ctx.formalParameters());
        interfaceMethodDeclarationType.params = params;
    }

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        const modifiers = ctx.modifier_list()?.map((mod) => {
            const { type, ...modifier } = makeModifierType(mod);
            return modifier;
        });
        interfaceMethodDeclarationType.modifiers = modifiers;
    }

    return interfaceMethodDeclarationType;
};
