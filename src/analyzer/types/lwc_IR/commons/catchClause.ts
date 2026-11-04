import { isCatchClause, type CatchClause } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class CatchClauseTypeClass extends LwcCommonTypeClass<'catchClause'> {
    private constructor(originalSource: string) {
        super('catchClause', originalSource);
    }

    static create(target: CatchClause, originalSource: string): CatchClauseTypeClass {
        throw new Error('CatchClauseTypeClass.create is not implemented: ' + target.type);
    }
}

export const catchClauseTypePair: EvaluatePair<CatchClause, CatchClauseTypeClass> =
    makeEvaluatePair(isCatchClause, (target, originalSource) =>
        CatchClauseTypeClass.create(target, originalSource),
    );

export const isCatchClauseType = (
    target: LwcCommonTypeClass<string>,
): target is CatchClauseTypeClass => target instanceof CatchClauseTypeClass;
