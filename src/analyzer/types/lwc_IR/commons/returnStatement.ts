import { isReturnStatement, type ReturnStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ReturnStatementTypeClass extends LwcCommonTypeClass<'returnStatement'> {
    private constructor(originalSource: string) {
        super('returnStatement', originalSource);
    }

    static create(target: ReturnStatement, originalSource: string): ReturnStatementTypeClass {
        throw new Error('ReturnStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const returnStatementTypePair: EvaluatePair<ReturnStatement, ReturnStatementTypeClass> =
    makeEvaluatePair(isReturnStatement, (target, originalSource) =>
        ReturnStatementTypeClass.create(target, originalSource),
    );

export const isReturnStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ReturnStatementTypeClass => target instanceof ReturnStatementTypeClass;
