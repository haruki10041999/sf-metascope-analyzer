import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type CompilationUnitType = {
    type: 'compilationUnit';
    declaration: Omit<DeclarationType, 'type'>;
};

export const makeCompilationUnitType = (ctx: CompilationUnitContext): CompilationUnitType => {
    const { type, ...declaration } = new DeclarationVisitor().visit(ctx.typeDeclaration());

    return {
        type: 'compilationUnit',
        declaration: declaration,
    };
};
