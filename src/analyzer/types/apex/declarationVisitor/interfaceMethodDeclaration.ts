import { InterfaceMethodDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';
import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type InterfaceMethodDeclarationType = {
    type: 'InterfaceMethodDeclaration';
    declaration: {
        type: TypeType | 'void';
        name: IdType;
        params?: ParameterType;
        modifiers?: ModifierType[];
    };
};

export const makeInterfaceMethodDeclarationType = (
    ctx: InterfaceMethodDeclarationContext,
): InterfaceMethodDeclarationType => {
    const methodName = new IdVisitor().visit(ctx.id());
    const returnType = ctx.typeRef()
        ? (() => {
              const returnType = new TypeVisitor().visit(ctx.typeRef());
              return returnType;
          })()
        : 'void';

    const interfaceMethodDeclarationType: InterfaceMethodDeclarationType = {
        type: 'InterfaceMethodDeclaration',
        declaration: {
            type: returnType,
            name: methodName,
        },
    };

    if (ctx.formalParameters()) {
        const params = new ParameterVisitor().visit(ctx.formalParameters());
        interfaceMethodDeclarationType.declaration.params = params;
    }

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        const modifiers = ctx.modifier_list()?.map((mod) => {
            const modifier = new ModifierVisitor().visit(mod);
            return modifier;
        });
        interfaceMethodDeclarationType.declaration.modifiers = modifiers;
    }

    return interfaceMethodDeclarationType;
};
