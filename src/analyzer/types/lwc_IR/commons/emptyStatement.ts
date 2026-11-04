import { isEmptyStatement, type EmptyStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EmptyStatementTypeClass extends LwcCommonTypeClass<'emptyStatement'> {
    private constructor(originalSource: string) {
        super('emptyStatement', originalSource);
    }

    static create(target: EmptyStatement, originalSource: string): EmptyStatementTypeClass {
        throw new Error('EmptyStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const emptyStatementTypePair: EvaluatePair<EmptyStatement, EmptyStatementTypeClass> =
    makeEvaluatePair(isEmptyStatement, (target, originalSource) =>
        EmptyStatementTypeClass.create(target, originalSource),
    );

export const isEmptyStatementType = (
    target: LwcCommonTypeClass<string>,
): target is EmptyStatementTypeClass => target instanceof EmptyStatementTypeClass;
