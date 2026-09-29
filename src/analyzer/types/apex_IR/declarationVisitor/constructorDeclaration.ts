import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { ParameterType, ParameterVisitor } from '../parameterVisitor';

export type ConstructorDeclarationType = {
    type: 'constructorDeclaration';
    declaration: {
        name: NameType;
        block: BlockType;
        params?: ParameterType;
    };
};

export const makeConstructorDeclarationType = (
    ctx: ConstructorDeclarationContext,
): ConstructorDeclarationType => {
    if (!ctx.qualifiedName() || !ctx.block()) {
        throw new Error('値が異常です。ConstructorDeclarationContext: ' + ctx.getText());
    }

    const name = new NameVisitor().visit(ctx.qualifiedName());
    const block = new BlockVisitor().visit(ctx.block());

    const constructorDeclarationType: ConstructorDeclarationType = {
        type: 'constructorDeclaration',
        declaration: {
            name: name,
            block: block,
        },
    };

    if (ctx.formalParameters()) {
        const params = new ParameterVisitor().visit(ctx.formalParameters());
        constructorDeclarationType.declaration.params = params;
    }

    return constructorDeclarationType;
};
