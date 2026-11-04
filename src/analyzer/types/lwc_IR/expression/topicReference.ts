import { isTopicReference, type TopicReference } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TopicReferenceTypeClass extends LwcCommonTypeClass<'topicReference'> {
    private constructor(originalSource: string) {
        super('topicReference', originalSource);
    }

    static create(target: TopicReference, originalSource: string): TopicReferenceTypeClass {
        throw new Error('TopicReferenceTypeClass.create is not implemented: ' + target.type);
    }
}

export const topicReferenceTypePair: EvaluatePair<TopicReference, TopicReferenceTypeClass> =
    makeEvaluatePair(isTopicReference, (target, originalSource) =>
        TopicReferenceTypeClass.create(target, originalSource),
    );

export const isTopicReferenceType = (
    target: LwcCommonTypeClass<string>,
): target is TopicReferenceTypeClass => target instanceof TopicReferenceTypeClass;
