import { isArrowFunctionExpression, type ArrowFunctionExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ArrowFunctionExpressionTypeClass extends LwcCommonTypeClass<'arrowFunctionExpression'> {
    private constructor(originalSource: string) {
        super('arrowFunctionExpression', originalSource);
    }

    static create(
        target: ArrowFunctionExpression,
        originalSource: string,
    ): ArrowFunctionExpressionTypeClass {
        throw new Error(
            'ArrowFunctionExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const arrowFunctionExpressionTypePair: EvaluatePair<
    ArrowFunctionExpression,
    ArrowFunctionExpressionTypeClass
> = makeEvaluatePair(isArrowFunctionExpression, (target, originalSource) =>
    ArrowFunctionExpressionTypeClass.create(target, originalSource),
);

export const isArrowFunctionExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ArrowFunctionExpressionTypeClass => target instanceof ArrowFunctionExpressionTypeClass;
