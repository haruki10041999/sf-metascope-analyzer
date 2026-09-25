import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';
import { NameType, NameVisitor } from '../nameVisitor';

import { ModifierType, makeModifierType } from '../modifier';

export type CatchClauseType = {
    type: 'catchClause';
    exception: Omit<NameType, 'type'>;
    variant: Omit<IdType, 'type'>;
    block: Omit<BlockType, 'type'>;
    modifier?: Omit<ModifierType, 'type'>[];
};

export const makeCatchClauseType = (ctx: CatchClauseContext): CatchClauseType => {
    const { type: exceptionType, ...exception } = new NameVisitor().visit(ctx.qualifiedName());
    const { type: variantType, ...variant } = new IdVisitor().visit(ctx.id());
    const { type: blockType, ...block } = new BlockVisitor().visit(ctx.block());

    const catchClauseType: CatchClauseType = {
        type: 'catchClause',
        exception: exception,
        variant: variant,
        block: block,
    };

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        catchClauseType.modifier = ctx.modifier_list().map((modifierCtx) => {
            const { type, ...modifier } = makeModifierType(modifierCtx);
            return modifier;
        });
    }

    return catchClauseType;
};
