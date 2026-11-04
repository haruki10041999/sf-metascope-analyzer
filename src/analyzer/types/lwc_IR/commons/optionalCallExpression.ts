import { isOptionalCallExpression, type OptionalCallExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class OptionalCallExpressionTypeClass extends LwcCommonTypeClass<'optionalCallExpression'> {
    private constructor(originalSource: string) {
        super('optionalCallExpression', originalSource);
    }

    static create(
        target: OptionalCallExpression,
        originalSource: string,
    ): OptionalCallExpressionTypeClass {
        throw new Error(
            'OptionalCallExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const optionalCallExpressionTypePair: EvaluatePair<
    OptionalCallExpression,
    OptionalCallExpressionTypeClass
> = makeEvaluatePair(isOptionalCallExpression, (target, originalSource) =>
    OptionalCallExpressionTypeClass.create(target, originalSource),
);

export const isOptionalCallExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalCallExpressionTypeClass => target instanceof OptionalCallExpressionTypeClass;
