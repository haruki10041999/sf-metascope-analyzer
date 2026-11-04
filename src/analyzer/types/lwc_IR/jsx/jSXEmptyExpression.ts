import { isJSXEmptyExpression, type JSXEmptyExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXEmptyExpressionTypeClass extends LwcCommonTypeClass<'jSXEmptyExpression'> {
    private constructor(originalSource: string) {
        super('jSXEmptyExpression', originalSource);
    }

    static create(target: JSXEmptyExpression, originalSource: string): JSXEmptyExpressionTypeClass {
        throw new Error('JSXEmptyExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXEmptyExpressionTypePair: EvaluatePair<
    JSXEmptyExpression,
    JSXEmptyExpressionTypeClass
> = makeEvaluatePair(isJSXEmptyExpression, (target, originalSource) =>
    JSXEmptyExpressionTypeClass.create(target, originalSource),
);

export const isJSXEmptyExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is JSXEmptyExpressionTypeClass => target instanceof JSXEmptyExpressionTypeClass;
