import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { BlockType, BlockVisitor } from '../blockVisitor';
import { NameType, NameVisitor } from '../nameVisitor';

import { FormalParametersType, makeFormalParametersType } from '../formalParameters';

export type ConstructorDeclarationType = {
    type: 'constructorDeclaration';
    name: Omit<NameType, 'type'>;
    params?: Omit<FormalParametersType, 'type'>;
    block: Omit<BlockType, 'type'>;
};

export const makeConstructorDeclarationType = (
    ctx: ConstructorDeclarationContext,
): ConstructorDeclarationType => {
    const { type: nameType, ...name } = new NameVisitor().visit(ctx.qualifiedName());
    const { type: blockType, ...block } = new BlockVisitor().visit(ctx.block());

    const constructorDeclarationType: ConstructorDeclarationType = {
        type: 'constructorDeclaration',
        name: name,
        block: block,
    };

    if (ctx.formalParameters()) {
        const { type: paramsType, ...params } = makeFormalParametersType(ctx.formalParameters());
        constructorDeclarationType.params = params;
    }

    return constructorDeclarationType;
};
