import { isBreakStatement, type BreakStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BreakStatementTypeClass extends LwcCommonTypeClass<'breakStatement'> {
    private constructor(originalSource: string) {
        super('breakStatement', originalSource);
    }

    static create(target: BreakStatement, originalSource: string): BreakStatementTypeClass {
        throw new Error('BreakStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const breakStatementTypePair: EvaluatePair<BreakStatement, BreakStatementTypeClass> =
    makeEvaluatePair(isBreakStatement, (target, originalSource) =>
        BreakStatementTypeClass.create(target, originalSource),
    );

export const isBreakStatementType = (
    target: LwcCommonTypeClass<string>,
): target is BreakStatementTypeClass => target instanceof BreakStatementTypeClass;
