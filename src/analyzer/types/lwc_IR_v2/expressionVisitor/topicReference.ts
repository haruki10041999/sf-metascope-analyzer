import { isTopicReference, type TopicReference } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TopicReferenceTypeClass extends LwcCommonTypeClass<'topicReference'> {
    private constructor() {
        super('topicReference');
    }

    static create(_target: TopicReference, _originalSource: string): TopicReferenceTypeClass {
        return new TopicReferenceTypeClass();
    }
}

export const topicReferenceTypePair: EvaluatePair<TopicReference, TopicReferenceTypeClass> =
    makeEvaluatePair(isTopicReference, (target, originalSource) =>
        TopicReferenceTypeClass.create(target, originalSource),
    );

export const isTopicReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TopicReferenceTypeClass => target instanceof TopicReferenceTypeClass;
