import { isTryStatement, type TryStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { blockStatementTypePair, type BlockStatementTypeClass } from './blockStatement';
import { catchClauseTypePair, type CatchClauseTypeClass } from './catchClause';

const tryStatementBlockPairs = lazyPairs(() => [blockStatementTypePair] as const);
const tryStatementHandlerPairs = lazyPairs(() => [catchClauseTypePair] as const);
const tryStatementFinalizerPairs = lazyPairs(() => [blockStatementTypePair] as const);

export type TryStatementFields = {
    block: BlockStatementTypeClass | LwcErrorTypeClass;
    handler: CatchClauseTypeClass | LwcErrorTypeClass | null;
    finalizer: BlockStatementTypeClass | LwcErrorTypeClass | null;
};

export class TryStatementTypeClass extends LwcCommonTypeClass<'tryStatement'> {
    private readonly value: TryStatementFields;

    private constructor(value: TryStatementFields) {
        super('tryStatement');
        this.value = value;
    }

    static create(target: TryStatement, originalSource: string): TryStatementTypeClass {
        return new TryStatementTypeClass({
            block: visitNode(
                target.block,
                originalSource,
                tryStatementBlockPairs(),
                'TryStatement.block',
            ),
            handler: visitOptionalNode(
                target.handler,
                originalSource,
                tryStatementHandlerPairs(),
                'TryStatement.handler',
            ),
            finalizer: visitOptionalNode(
                target.finalizer,
                originalSource,
                tryStatementFinalizerPairs(),
                'TryStatement.finalizer',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TryStatementFields {
        return this.value;
    }

    getBlock(): TryStatementFields['block'] {
        return this.value.block;
    }

    getHandler(): TryStatementFields['handler'] {
        return this.value.handler;
    }

    getFinalizer(): TryStatementFields['finalizer'] {
        return this.value.finalizer;
    }
}

export const tryStatementTypePair: EvaluatePair<TryStatement, TryStatementTypeClass> =
    makeEvaluatePair(isTryStatement, (target, originalSource) =>
        TryStatementTypeClass.create(target, originalSource),
    );

export const isTryStatementType = (
    target: LwcCommonTypeClass<string>,
): target is TryStatementTypeClass => target instanceof TryStatementTypeClass;
