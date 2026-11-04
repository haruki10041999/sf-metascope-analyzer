import { isTemplateElement, type TemplateElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TemplateElementTypeClass extends LwcCommonTypeClass<'templateElement'> {
    private constructor(originalSource: string) {
        super('templateElement', originalSource);
    }

    static create(target: TemplateElement, originalSource: string): TemplateElementTypeClass {
        throw new Error('TemplateElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const templateElementTypePair: EvaluatePair<TemplateElement, TemplateElementTypeClass> =
    makeEvaluatePair(isTemplateElement, (target, originalSource) =>
        TemplateElementTypeClass.create(target, originalSource),
    );

export const isTemplateElementType = (
    target: LwcCommonTypeClass<string>,
): target is TemplateElementTypeClass => target instanceof TemplateElementTypeClass;
