import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';

import {
    LocalVariableDeclarationTypeClass,
    DeclarationVisitor,
    isLocalVariableDeclarationType,
} from '../declarationVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class LocalVariableDeclarationStatementTypeClass extends StatementTypeClass<
    'localVariableDeclarationStatement',
    LocalVariableDeclarationTypeClass
> {
    private constructor(value: LocalVariableDeclarationTypeClass | ApexErrorTypeClass) {
        super('localVariableDeclarationStatement', value);
    }

    static create(ctx: LocalVariableDeclarationStatementContext) {
        if (!ctx.localVariableDeclaration()) {
            throw new Error(
                '値が異常です。LocalVariableDeclarationStatementContext: ' + ctx.getText(),
            );
        }

        return new LocalVariableDeclarationStatementTypeClass(
            isApexValidClass(
                new DeclarationVisitor().visit(ctx.localVariableDeclaration()),
                isLocalVariableDeclarationType,
                'localVariableDeclaration',
            ),
        );
    }
}

export const isLocalVariableDeclarationStatementType = (
    target: ApexCommonTypeClass<string>,
): target is LocalVariableDeclarationStatementTypeClass => {
    return target instanceof LocalVariableDeclarationStatementTypeClass;
};

