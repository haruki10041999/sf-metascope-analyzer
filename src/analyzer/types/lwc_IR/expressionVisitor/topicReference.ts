import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTopicReference, type TopicReference } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TopicReferenceFields = TypeField<'topicReference'>;

export class TopicReferenceTypeClass extends LwcCommonTypeClass<
    'topicReference',
    TopicReferenceFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('topicReference', {}, sourceSpan);
    }

    static create(target: TopicReference, originalSource: string): TopicReferenceTypeClass {
        return new TopicReferenceTypeClass(getSourceSpan(target, originalSource));
    }
}

export const topicReferenceTypePair: EvaluatePair<TopicReference, TopicReferenceTypeClass> =
    makeEvaluatePair(isTopicReference, (target, originalSource) =>
        TopicReferenceTypeClass.create(target, originalSource),
    );

export const isTopicReferenceType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TopicReferenceTypeClass => target instanceof TopicReferenceTypeClass;
