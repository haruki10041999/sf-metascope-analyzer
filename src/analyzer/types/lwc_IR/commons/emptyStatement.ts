import { isEmptyStatement, type EmptyStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class EmptyStatementTypeClass extends LwcCommonTypeClass<'emptyStatement'> {
    private constructor() {
        super('emptyStatement');
    }

    static create(_target: EmptyStatement, _originalSource: string): EmptyStatementTypeClass {
        return new EmptyStatementTypeClass();
    }
}

export const emptyStatementTypePair: EvaluatePair<EmptyStatement, EmptyStatementTypeClass> =
    makeEvaluatePair(isEmptyStatement, (target, originalSource) =>
        EmptyStatementTypeClass.create(target, originalSource),
    );

export const isEmptyStatementType = (
    target: LwcCommonTypeClass<string>,
): target is EmptyStatementTypeClass => target instanceof EmptyStatementTypeClass;
