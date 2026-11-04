import { isJSXExpressionContainer, type JSXExpressionContainer } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXExpressionContainerTypeClass extends LwcCommonTypeClass<'jSXExpressionContainer'> {
    private constructor(originalSource: string) {
        super('jSXExpressionContainer', originalSource);
    }

    static create(
        target: JSXExpressionContainer,
        originalSource: string,
    ): JSXExpressionContainerTypeClass {
        throw new Error(
            'JSXExpressionContainerTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const jSXExpressionContainerTypePair: EvaluatePair<
    JSXExpressionContainer,
    JSXExpressionContainerTypeClass
> = makeEvaluatePair(isJSXExpressionContainer, (target, originalSource) =>
    JSXExpressionContainerTypeClass.create(target, originalSource),
);

export const isJSXExpressionContainerType = (
    target: LwcCommonTypeClass<string>,
): target is JSXExpressionContainerTypeClass => target instanceof JSXExpressionContainerTypeClass;
