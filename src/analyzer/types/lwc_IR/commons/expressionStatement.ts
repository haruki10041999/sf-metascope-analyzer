import { isExpressionStatement, type ExpressionStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ExpressionStatementTypeClass extends LwcCommonTypeClass<'expressionStatement'> {
    private constructor(originalSource: string) {
        super('expressionStatement', originalSource);
    }

    static create(
        target: ExpressionStatement,
        originalSource: string,
    ): ExpressionStatementTypeClass {
        throw new Error('ExpressionStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const expressionStatementTypePair: EvaluatePair<
    ExpressionStatement,
    ExpressionStatementTypeClass
> = makeEvaluatePair(isExpressionStatement, (target, originalSource) =>
    ExpressionStatementTypeClass.create(target, originalSource),
);

export const isExpressionStatementType = (
    target: LwcCommonTypeClass<string>,
): target is ExpressionStatementTypeClass => target instanceof ExpressionStatementTypeClass;
