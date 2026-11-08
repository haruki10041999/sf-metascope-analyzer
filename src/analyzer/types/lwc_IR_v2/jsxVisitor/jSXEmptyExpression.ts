import { isJSXEmptyExpression, type JSXEmptyExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXEmptyExpressionTypeClass extends LwcCommonTypeClass<'jSXEmptyExpression'> {
    private constructor() {
        super('jSXEmptyExpression');
    }

    static create(
        _target: JSXEmptyExpression,
        _originalSource: string,
    ): JSXEmptyExpressionTypeClass {
        return new JSXEmptyExpressionTypeClass();
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
