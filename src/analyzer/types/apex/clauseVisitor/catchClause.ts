import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';
import { NameType, NameVisitor } from '../nameVisitor';
import { ModifierType, ModifierVisitor } from '../modifierVisitor';

export type CatchClauseType = {
    type: 'catchClause';
    clause: {
        exception: NameType;
        variant: IdType;
        block: BlockType;
        modifier?: ModifierType[];
    };
};

export const makeCatchClauseType = (ctx: CatchClauseContext): CatchClauseType => {
    const exception = new NameVisitor().visit(ctx.qualifiedName());
    const variant = new IdVisitor().visit(ctx.id());
    const block = new BlockVisitor().visit(ctx.block());

    const catchClauseType: CatchClauseType = {
        type: 'catchClause',
        clause: {
            exception: exception,
            variant: variant,
            block: block,
        },
    };

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        catchClauseType.clause.modifier = ctx.modifier_list().map((modifierCtx) => {
            const modifier = new ModifierVisitor().visit(modifierCtx);
            return modifier;
        });
    }

    return catchClauseType;
};
