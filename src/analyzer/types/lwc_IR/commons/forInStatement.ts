import { isForInStatement, type ForInStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ForInStatementTypeClass extends LwcCommonTypeClass<'forInStatement'> {
    private constructor(originalSource: string) {
        super('forInStatement', originalSource);
    }

    static create(target: ForInStatement, originalSource: string): ForInStatementTypeClass {
        throw new Error('ForInStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const forInStatementTypePair: EvaluatePair<ForInStatement, ForInStatementTypeClass> =
    makeEvaluatePair(isForInStatement, (target, originalSource) =>
        ForInStatementTypeClass.create(target, originalSource),
    );

export const isForInStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForInStatementTypeClass => target instanceof ForInStatementTypeClass;
