import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { TypeType, TypeVisitor } from '../typeVisitor';
import { VariableType, VariableVisitor } from '../variableVisitor';

export type FieldDeclarationType = {
    type: 'fieldDeclaration';
    declaration: {
        type: TypeType;
        name: VariableType;
    };
};

export const makeFieldDeclarationType = (ctx: FieldDeclarationContext): FieldDeclarationType => {
    const type = new TypeVisitor().visit(ctx.typeRef());
    const name = new VariableVisitor().visit(ctx.variableDeclarators());
    return {
        type: 'fieldDeclaration',
        declaration: {
            type: type,
            name: name,
        },
    };
};
