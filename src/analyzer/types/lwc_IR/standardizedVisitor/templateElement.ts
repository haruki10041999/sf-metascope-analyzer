import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTemplateElement, type TemplateElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type TemplateElementFields = TypeField<'templateElement'> & {
    value: TemplateElement['value'];
    tail: TemplateElement['tail'];
};

export class TemplateElementTypeClass extends LwcCommonTypeClass<
    'templateElement',
    TemplateElementFields
> {
    private constructor(value: FieldsOf<TemplateElementFields>, sourceSpan: SourceSpan) {
        super('templateElement', value, sourceSpan);
    }

    static create(target: TemplateElement, originalSource: string): TemplateElementTypeClass {
        return new TemplateElementTypeClass(
            {
                value: target.value,
                tail: target.tail,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): TemplateElementFields['value'] {
        return this.getFields().value;
    }

    getTail(): TemplateElementFields['tail'] {
        return this.getFields().tail;
    }
}

export const templateElementTypePair: EvaluatePair<TemplateElement, TemplateElementTypeClass> =
    makeEvaluatePair(isTemplateElement, (target, originalSource) =>
        TemplateElementTypeClass.create(target, originalSource),
    );

export const isTemplateElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TemplateElementTypeClass => target instanceof TemplateElementTypeClass;
