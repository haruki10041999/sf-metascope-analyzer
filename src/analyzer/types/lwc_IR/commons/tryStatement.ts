import { isTryStatement, type TryStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TryStatementTypeClass extends LwcCommonTypeClass<'tryStatement'> {
    private constructor(originalSource: string) {
        super('tryStatement', originalSource);
    }

    static create(target: TryStatement, originalSource: string): TryStatementTypeClass {
        throw new Error('TryStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const tryStatementTypePair: EvaluatePair<TryStatement, TryStatementTypeClass> =
    makeEvaluatePair(isTryStatement, (target, originalSource) =>
        TryStatementTypeClass.create(target, originalSource),
    );

export const isTryStatementType = (
    target: LwcCommonTypeClass<string>,
): target is TryStatementTypeClass => target instanceof TryStatementTypeClass;
