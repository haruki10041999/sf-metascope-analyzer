import { ForInitContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from './declarationVisitor';
import { ListType, ListVisitor } from './listVisitor';

export type ForInitType = {
    type: 'forInit';
    init: Omit<DeclarationType, 'type'> | Omit<ListType, 'type'>;
};

export const makeForInitType = (ctx: ForInitContext): ForInitType => {
    if (ctx.localVariableDeclaration()) {
        const { type, ...init } = new DeclarationVisitor().visit(ctx.localVariableDeclaration());
        return {
            type: 'forInit',
            init: init,
        };
    }

    if (ctx.expressionList()) {
        const { type, ...init } = new ListVisitor().visit(ctx.expressionList());
        return {
            type: 'forInit',
            init: init,
        };
    }

    throw new Error('値が異常です。ForInitContext: ' + ctx.getText());
};
