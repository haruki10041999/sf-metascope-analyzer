import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTryStatement, type TryStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { BlockStatementTypeClass } from './blockStatement';
import { CatchClauseTypeClass } from './catchClause';

/** catch と finally の少なくとも一方が要る */
export type TryStatementFields = TypeField<'tryStatement'> & {
    block: BlockStatementTypeClass;
} & (
        | { handler: CatchClauseTypeClass; finalizer: BlockStatementTypeClass | null }
        | { handler: null; finalizer: BlockStatementTypeClass }
    );

export class TryStatementTypeClass extends LwcCommonTypeClass<'tryStatement', TryStatementFields> {
    private constructor(value: FieldsOf<TryStatementFields>, sourceSpan: SourceSpan) {
        super('tryStatement', value, sourceSpan);
    }

    static create(target: TryStatement, originalSource: string): TryStatementTypeClass {
        const block = BlockStatementTypeClass.create(target.block, originalSource);
        const finalizer =
            target.finalizer == null
                ? null
                : BlockStatementTypeClass.create(target.finalizer, originalSource);
        return new TryStatementTypeClass(
            target.handler != null
                ? {
                      block,
                      handler: CatchClauseTypeClass.create(target.handler, originalSource),
                      finalizer,
                  }
                : {
                      block,
                      handler: null,
                      finalizer:
                          finalizer ??
                          failIrBuild(
                              'TYPE_MISMATCH',
                              target,
                              originalSource,
                              'try には catch か finally が要ります',
                          ),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getBlock(): TryStatementFields['block'] {
        return this.getFields().block;
    }

    getHandler(): TryStatementFields['handler'] {
        return this.getFields().handler;
    }

    getFinalizer(): TryStatementFields['finalizer'] {
        return this.getFields().finalizer;
    }
}

export const tryStatementTypePair: EvaluatePair<TryStatement, TryStatementTypeClass> =
    makeEvaluatePair(isTryStatement, (target, originalSource) =>
        TryStatementTypeClass.create(target, originalSource),
    );

export const isTryStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TryStatementTypeClass => target instanceof TryStatementTypeClass;
