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
    if (!ctx.id() && !ctx.VOID() && !ctx.typeRef()) {
        throw new Error('値が異常です。InterfaceMethodDeclarationContext: ' + ctx.getText());
    }

    const methodName = new IdVisitor().visit(ctx.id());
    const returnType: TypeType | 'void' = ctx.VOID()
        ? 'void'
        : new TypeVisitor().visit(ctx.typeRef());

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
