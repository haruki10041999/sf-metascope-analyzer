import { isJSXClosingElement, type JSXClosingElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXClosingElementTypeClass extends LwcCommonTypeClass<'jSXClosingElement'> {
    private constructor(originalSource: string) {
        super('jSXClosingElement', originalSource);
    }

    static create(target: JSXClosingElement, originalSource: string): JSXClosingElementTypeClass {
        throw new Error('JSXClosingElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXClosingElementTypePair: EvaluatePair<
    JSXClosingElement,
    JSXClosingElementTypeClass
> = makeEvaluatePair(isJSXClosingElement, (target, originalSource) =>
    JSXClosingElementTypeClass.create(target, originalSource),
);

export const isJSXClosingElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXClosingElementTypeClass => target instanceof JSXClosingElementTypeClass;
