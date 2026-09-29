import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';

export type LocalVariableDeclarationStatementType = {
    type: 'localVariableDeclarationStatement';
    statement: DeclarationType;
};

export const makeLocalVariableDeclarationStatementType = (
    ctx: LocalVariableDeclarationStatementContext,
): LocalVariableDeclarationStatementType => {
    if (!ctx.localVariableDeclaration()) {
        throw new Error('値が異常です。LocalVariableDeclarationStatementContext: ' + ctx.getText());
    }

    return {
        type: 'localVariableDeclarationStatement',
        statement: new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
    };
};

