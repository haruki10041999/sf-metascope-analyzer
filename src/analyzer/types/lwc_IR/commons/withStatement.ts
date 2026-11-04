import { isWithStatement, type WithStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class WithStatementTypeClass extends LwcCommonTypeClass<'withStatement'> {
    private constructor(originalSource: string) {
        super('withStatement', originalSource);
    }

    static create(target: WithStatement, originalSource: string): WithStatementTypeClass {
        throw new Error('WithStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const withStatementTypePair: EvaluatePair<WithStatement, WithStatementTypeClass> =
    makeEvaluatePair(isWithStatement, (target, originalSource) =>
        WithStatementTypeClass.create(target, originalSource),
    );

export const isWithStatementType = (
    target: LwcCommonTypeClass<string>,
): target is WithStatementTypeClass => target instanceof WithStatementTypeClass;
