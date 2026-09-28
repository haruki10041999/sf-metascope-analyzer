import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type CompilationUnitType = {
    type: 'compilationUnit';
    unit: DeclarationType;
};

export const makeCompilationUnitType = (ctx: CompilationUnitContext): CompilationUnitType => {
    const declaration = new DeclarationVisitor().visit(ctx.typeDeclaration());

    return {
        type: 'compilationUnit',
        unit: declaration,
    };
};

