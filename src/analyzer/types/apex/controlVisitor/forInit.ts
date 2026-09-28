import { ForInitContext } from '@apexdevtools/apex-parser';

import { DeclarationType, DeclarationVisitor } from '../declarationVisitor';
import { ListType, ListVisitor } from '../listVisitor';

export type ForInitType = {
    type: 'forInit';
    init: DeclarationType | ListType;
};

export const makeForInitType = (ctx: ForInitContext): ForInitType => {
    if (ctx.localVariableDeclaration()) {
        const init = new DeclarationVisitor().visit(ctx.localVariableDeclaration());
        return {
            type: 'forInit',
            init: init,
        };
    }

    if (ctx.expressionList()) {
        const init = new ListVisitor().visit(ctx.expressionList());
        return {
            type: 'forInit',
            init: init,
        };
    }

    throw new Error('値が異常です。ForInitContext: ' + ctx.getText());
};
