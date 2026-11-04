import { isDoWhileStatement, type DoWhileStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DoWhileStatementTypeClass extends LwcCommonTypeClass<'doWhileStatement'> {
    private constructor(originalSource: string) {
        super('doWhileStatement', originalSource);
    }

    static create(target: DoWhileStatement, originalSource: string): DoWhileStatementTypeClass {
        throw new Error('DoWhileStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const doWhileStatementTypePair: EvaluatePair<DoWhileStatement, DoWhileStatementTypeClass> =
    makeEvaluatePair(isDoWhileStatement, (target, originalSource) =>
        DoWhileStatementTypeClass.create(target, originalSource),
    );

export const isDoWhileStatementType = (
    target: LwcCommonTypeClass<string>,
): target is DoWhileStatementTypeClass => target instanceof DoWhileStatementTypeClass;
