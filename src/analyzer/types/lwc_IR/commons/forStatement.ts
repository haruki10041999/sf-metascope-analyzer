import { isForStatement, type ForStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ForStatementTypeClass extends LwcCommonTypeClass<'forStatement'> {
    private constructor(originalSource: string) {
        super('forStatement', originalSource);
    }

    static create(target: ForStatement, originalSource: string): ForStatementTypeClass {
        throw new Error('ForStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const forStatementTypePair: EvaluatePair<ForStatement, ForStatementTypeClass> =
    makeEvaluatePair(isForStatement, (target, originalSource) =>
        ForStatementTypeClass.create(target, originalSource),
    );

export const isForStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ForStatementTypeClass => target instanceof ForStatementTypeClass;
