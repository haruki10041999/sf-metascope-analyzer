import { isTemplateElement, type TemplateElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type TemplateElementFields = {
    value: TemplateElement['value'];
    tail: TemplateElement['tail'];
};

export class TemplateElementTypeClass extends LwcCommonTypeClass<'templateElement'> {
    private readonly value: TemplateElementFields;

    private constructor(value: TemplateElementFields) {
        super('templateElement');
        this.value = value;
    }

    static create(target: TemplateElement, originalSource: string): TemplateElementTypeClass {
        return new TemplateElementTypeClass({
            value: target.value,
            tail: target.tail,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TemplateElementFields {
        return this.value;
    }

    getValue(): TemplateElementFields['value'] {
        return this.value.value;
    }

    getTail(): TemplateElementFields['tail'] {
        return this.value.tail;
    }
}

export const templateElementTypePair: EvaluatePair<TemplateElement, TemplateElementTypeClass> =
    makeEvaluatePair(isTemplateElement, (target, originalSource) =>
        TemplateElementTypeClass.create(target, originalSource),
    );

export const isTemplateElementType = (
    target: LwcCommonTypeClass<string>,
): target is TemplateElementTypeClass => target instanceof TemplateElementTypeClass;
