import { isJSXMemberExpression, type JSXMemberExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXMemberExpressionTypeClass extends LwcCommonTypeClass<'jSXMemberExpression'> {
    private constructor(originalSource: string) {
        super('jSXMemberExpression', originalSource);
    }

    static create(
        target: JSXMemberExpression,
        originalSource: string,
    ): JSXMemberExpressionTypeClass {
        throw new Error('JSXMemberExpressionTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXMemberExpressionTypePair: EvaluatePair<
    JSXMemberExpression,
    JSXMemberExpressionTypeClass
> = makeEvaluatePair(isJSXMemberExpression, (target, originalSource) =>
    JSXMemberExpressionTypeClass.create(target, originalSource),
);

export const isJSXMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is JSXMemberExpressionTypeClass => target instanceof JSXMemberExpressionTypeClass;
