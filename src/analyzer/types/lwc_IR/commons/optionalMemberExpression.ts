import { isOptionalMemberExpression, type OptionalMemberExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class OptionalMemberExpressionTypeClass extends LwcCommonTypeClass<'optionalMemberExpression'> {
    private constructor(originalSource: string) {
        super('optionalMemberExpression', originalSource);
    }

    static create(
        target: OptionalMemberExpression,
        originalSource: string,
    ): OptionalMemberExpressionTypeClass {
        throw new Error(
            'OptionalMemberExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const optionalMemberExpressionTypePair: EvaluatePair<
    OptionalMemberExpression,
    OptionalMemberExpressionTypeClass
> = makeEvaluatePair(isOptionalMemberExpression, (target, originalSource) =>
    OptionalMemberExpressionTypeClass.create(target, originalSource),
);

export const isOptionalMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is OptionalMemberExpressionTypeClass =>
    target instanceof OptionalMemberExpressionTypeClass;
