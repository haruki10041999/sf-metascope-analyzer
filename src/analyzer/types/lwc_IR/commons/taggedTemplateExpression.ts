import { isTaggedTemplateExpression, type TaggedTemplateExpression } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TaggedTemplateExpressionTypeClass extends LwcCommonTypeClass<'taggedTemplateExpression'> {
    private constructor(originalSource: string) {
        super('taggedTemplateExpression', originalSource);
    }

    static create(
        target: TaggedTemplateExpression,
        originalSource: string,
    ): TaggedTemplateExpressionTypeClass {
        throw new Error(
            'TaggedTemplateExpressionTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const taggedTemplateExpressionTypePair: EvaluatePair<
    TaggedTemplateExpression,
    TaggedTemplateExpressionTypeClass
> = makeEvaluatePair(isTaggedTemplateExpression, (target, originalSource) =>
    TaggedTemplateExpressionTypeClass.create(target, originalSource),
);

export const isTaggedTemplateExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is TaggedTemplateExpressionTypeClass =>
    target instanceof TaggedTemplateExpressionTypeClass;
