import { TryStatementContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass, FinallyBlockTypeClass } from '../blockVisitor';
import { CatchClauseTypeClass } from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 文法は `TRY block (catchClause+ finallyBlock? | finallyBlock)`。catch か finally の少なくとも一方がある */
export type TryStatementType = TypeField<'tryStatement'> & { block: BlockTypeClass } & (
        | {
              catchClauses: [CatchClauseTypeClass, ...CatchClauseTypeClass[]];
              finallyBlock: FinallyBlockTypeClass | null;
          }
        | { catchClauses: []; finallyBlock: FinallyBlockTypeClass }
    );

export class TryStatementTypeClass extends ApexCommonTypeClass<'tryStatement', TryStatementType> {
    private constructor(fields: FieldsOf<TryStatementType>, sourceSpan: SourceSpan) {
        super('tryStatement', fields, sourceSpan);
    }

    static create(ctx: TryStatementContext): TryStatementTypeClass {
        const block = createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block');
        const [firstCatch, ...restCatches] = createNodeList(
            ctx.catchClause_list(),
            (c) => CatchClauseTypeClass.create(c),
            'catchClause',
        );

        if (firstCatch) {
            return new TryStatementTypeClass(
                {
                    block,
                    catchClauses: [firstCatch, ...restCatches],
                    finallyBlock: createOptionalNode(
                        ctx.finallyBlock(),
                        (c) => FinallyBlockTypeClass.create(c),
                        'finallyBlock',
                    ),
                },
                getSourceSpan(ctx),
            );
        }

        // catch がない (または、どれも作れなかった) ときは finally が必須
        return new TryStatementTypeClass(
            {
                block,
                catchClauses: [],
                finallyBlock: createNode(
                    ctx.finallyBlock(),
                    (c) => FinallyBlockTypeClass.create(c),
                    'finallyBlock',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getBlock(): TryStatementType['block'] {
        return this.getFields().block;
    }

    getCatchClauses(): TryStatementType['catchClauses'] {
        return this.getFields().catchClauses;
    }

    getFinallyBlock(): TryStatementType['finallyBlock'] {
        return this.getFields().finallyBlock;
    }
}

export const isTryStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TryStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('tryStatement', target);
};
