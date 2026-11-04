import { isJSXElement, type JSXElement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXElementTypeClass extends LwcCommonTypeClass<'jSXElement'> {
    private constructor(originalSource: string) {
        super('jSXElement', originalSource);
    }

    static create(target: JSXElement, originalSource: string): JSXElementTypeClass {
        throw new Error('JSXElementTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXElementTypePair: EvaluatePair<JSXElement, JSXElementTypeClass> = makeEvaluatePair(
    isJSXElement,
    (target, originalSource) => JSXElementTypeClass.create(target, originalSource),
);

export const isJSXElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXElementTypeClass => target instanceof JSXElementTypeClass;
