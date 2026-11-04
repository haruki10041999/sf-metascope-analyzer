import { isJSXOpeningElement, type JSXOpeningElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXOpeningElementTypeClass extends LwcCommonTypeClass<'jSXOpeningElement'> {
    private constructor(originalSource: string) {
        super('jSXOpeningElement', originalSource);
    }

    static create(target: JSXOpeningElement, originalSource: string): JSXOpeningElementTypeClass {
        throw new Error('JSXOpeningElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXOpeningElementTypePair: EvaluatePair<
    JSXOpeningElement,
    JSXOpeningElementTypeClass
> = makeEvaluatePair(isJSXOpeningElement, (target, originalSource) =>
    JSXOpeningElementTypeClass.create(target, originalSource),
);

export const isJSXOpeningElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXOpeningElementTypeClass => target instanceof JSXOpeningElementTypeClass;
