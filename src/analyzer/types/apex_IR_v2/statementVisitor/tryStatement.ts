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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class TryStatementTypeClass extends StatementTypeClass<
    'tryStatement',
    NormalBlockTypeClass
> {
    private catchBlock: (CatchClauseTypeClass | ApexErrorTypeClass)[];
    private finallyBlock: FinallyBlockTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: NormalBlockTypeClass | ApexErrorTypeClass,
        catchBlock: (CatchClauseTypeClass | ApexErrorTypeClass)[],
        finallyBlock: FinallyBlockTypeClass | ApexErrorTypeClass | null = null,
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
            visitNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
            visitNodeList(
                new ClauseVisitor(),
                ctx.catchClause_list() || [],
                isCatchClauseType,
                'catchClause',
            ),
            visitOptionalNode(
                new BlockVisitor(),
                ctx.finallyBlock(),
                isFinallyBlockType,
                'finallyBlock',
            ),
        );
    }

    getCatchBlock(): (CatchClauseTypeClass | ApexErrorTypeClass)[] {
        return this.catchBlock;
    }

    getFinallyBlock(): FinallyBlockTypeClass | ApexErrorTypeClass | null {
        return this.finallyBlock;
    }
}

export const isTryStatementType = (
    target: ApexCommonTypeClass<string>,
): target is TryStatementTypeClass => {
    return target instanceof TryStatementTypeClass;
};
