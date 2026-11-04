import { isForOfStatement, type ForOfStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ForOfStatementTypeClass extends LwcCommonTypeClass<'forOfStatement'> {
    private constructor(originalSource: string) {
        super('forOfStatement', originalSource);
    }

    static create(target: ForOfStatement, originalSource: string): ForOfStatementTypeClass {
        throw new Error('ForOfStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const forOfStatementTypePair: EvaluatePair<ForOfStatement, ForOfStatementTypeClass> =
    makeEvaluatePair(isForOfStatement, (target, originalSource) =>
        ForOfStatementTypeClass.create(target, originalSource),
    );

export const isForOfStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForOfStatementTypeClass => target instanceof ForOfStatementTypeClass;
