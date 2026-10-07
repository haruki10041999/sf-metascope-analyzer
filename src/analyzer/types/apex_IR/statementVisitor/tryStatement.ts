import { TryStatementContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '.';

import {
    NormalBlockTypeClass,
    FinallyBlockTypeClass,
    BlockVisitor,
    isNormalBlockType,
    isFinallyBlockType,
} from '../blockVisitor';
import { CatchClauseTypeClass, ClauseVisitor, isCatchClauseType } from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TryStatementTypeClass extends StatementTypeClass<NormalBlockTypeClass> {
    private catchBlock: (CatchClauseTypeClass | ErrorTypeClass)[];
    private finallyBlock: FinallyBlockTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: NormalBlockTypeClass | ErrorTypeClass,
        catchBlock: (CatchClauseTypeClass | ErrorTypeClass)[],
        finallyBlock: FinallyBlockTypeClass | ErrorTypeClass | null = null,
    ) {
        super('tryStatement', value);
        this.catchBlock = catchBlock;
        this.finallyBlock = finallyBlock;
    }

    static create(ctx: TryStatementContext): TryStatementTypeClass {
        if (!ctx.block() || (ctx.catchClause_list().length === 0 && !ctx.finallyBlock())) {
            throw new Error('値が異常です。TryStatementContext: ' + ctx.getText());
        }

        return new TryStatementTypeClass(
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
            isValidClassList(
                ctx.catchClause_list() || [],
                (ctx) => new ClauseVisitor().visit(ctx),
                isCatchClauseType,
                'catchClause',
            ),
            ctx.finallyBlock()
                ? isValidClass(
                      new BlockVisitor().visit(ctx.finallyBlock()),
                      isFinallyBlockType,
                      'finallyBlock',
                  )
                : null,
        );
    }

    getCatchBlock(): (CatchClauseTypeClass | ErrorTypeClass)[] {
        return this.catchBlock;
    }

    getFinallyBlock(): FinallyBlockTypeClass | ErrorTypeClass | null {
        return this.finallyBlock;
    }
}

export const isTryStatementType = (target: CommonTypeClass): target is TryStatementTypeClass => {
    return target instanceof TryStatementTypeClass;
};

