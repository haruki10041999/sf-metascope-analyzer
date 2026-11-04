import { isThrowStatement, type ThrowStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ThrowStatementTypeClass extends LwcCommonTypeClass<'throwStatement'> {
    private constructor(originalSource: string) {
        super('throwStatement', originalSource);
    }

    static create(target: ThrowStatement, originalSource: string): ThrowStatementTypeClass {
        throw new Error('ThrowStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const throwStatementTypePair: EvaluatePair<ThrowStatement, ThrowStatementTypeClass> =
    makeEvaluatePair(isThrowStatement, (target, originalSource) =>
        ThrowStatementTypeClass.create(target, originalSource),
    );

export const isThrowStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ThrowStatementTypeClass => target instanceof ThrowStatementTypeClass;
