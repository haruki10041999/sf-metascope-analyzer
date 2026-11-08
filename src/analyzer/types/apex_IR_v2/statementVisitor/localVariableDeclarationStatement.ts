import { LocalVariableDeclarationStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    LocalVariableDeclarationTypeClass,
    DeclarationVisitor,
    isLocalVariableDeclarationType,
} from '../declarationVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

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
            visitNode(
                new DeclarationVisitor(),
                ctx.localVariableDeclaration(),
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
