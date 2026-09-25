import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type LocalVariableDeclarationStatementType = {
    type: 'localVariableDeclarationStatement';
    variants: Omit<DeclarationType, 'type'>;
};

export const makeLocalVariableDeclarationStatementType = (
    ctx: LocalVariableDeclarationStatementContext,
): LocalVariableDeclarationStatementType => {
    return {
        type: 'localVariableDeclarationStatement',
        variants: new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
    };
};

