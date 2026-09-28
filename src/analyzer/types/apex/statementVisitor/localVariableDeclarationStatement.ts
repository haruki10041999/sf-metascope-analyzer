import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type LocalVariableDeclarationStatementType = {
    type: 'localVariableDeclarationStatement';
    statement: DeclarationType;
};

export const makeLocalVariableDeclarationStatementType = (
    ctx: LocalVariableDeclarationStatementContext,
): LocalVariableDeclarationStatementType => {
    return {
        type: 'localVariableDeclarationStatement',
        statement: new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
    };
};

