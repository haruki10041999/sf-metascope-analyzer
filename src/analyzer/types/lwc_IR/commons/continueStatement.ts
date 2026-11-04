import { isContinueStatement, type ContinueStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ContinueStatementTypeClass extends LwcCommonTypeClass<'continueStatement'> {
    private constructor(originalSource: string) {
        super('continueStatement', originalSource);
    }

    static create(target: ContinueStatement, originalSource: string): ContinueStatementTypeClass {
        throw new Error('ContinueStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const continueStatementTypePair: EvaluatePair<
    ContinueStatement,
    ContinueStatementTypeClass
> = makeEvaluatePair(isContinueStatement, (target, originalSource) =>
    ContinueStatementTypeClass.create(target, originalSource),
);

export const isContinueStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ContinueStatementTypeClass => target instanceof ContinueStatementTypeClass;
