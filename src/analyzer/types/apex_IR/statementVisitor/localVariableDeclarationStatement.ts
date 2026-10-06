import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    LocalVariableDeclarationTypeClass,
    DeclarationVisitor,
    isLocalVariableDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class LocalVariableDeclarationStatementTypeClass extends StatementTypeClass<LocalVariableDeclarationTypeClass> {
    private constructor(value: LocalVariableDeclarationTypeClass | ErrorTypeClass) {
        super('localVariableDeclarationStatement', value);
    }

    static create(ctx: LocalVariableDeclarationStatementContext) {
        if (!ctx.localVariableDeclaration()) {
            throw new Error(
                '値が異常です。LocalVariableDeclarationStatementContext: ' + ctx.getText(),
            );
        }

        return new LocalVariableDeclarationStatementTypeClass(
            isValidClass(
                new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
                isLocalVariableDeclarationType,
                'localVariableDeclaration',
            ),
        );
    }
}

export const isLocalVariableDeclarationStatementType = (
    target: CommonTypeClass,
): target is LocalVariableDeclarationStatementTypeClass => {
    return target instanceof LocalVariableDeclarationStatementTypeClass;
};

