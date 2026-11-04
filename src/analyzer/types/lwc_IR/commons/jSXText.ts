import { isJSXText, type JSXText } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXTextTypeClass extends LwcCommonTypeClass<'jSXText'> {
    private constructor(originalSource: string) {
        super('jSXText', originalSource);
    }

    static create(target: JSXText, originalSource: string): JSXTextTypeClass {
        throw new Error('JSXTextTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXTextTypePair: EvaluatePair<JSXText, JSXTextTypeClass> = makeEvaluatePair(
    isJSXText,
    (target, originalSource) => JSXTextTypeClass.create(target, originalSource),
);

export const isJSXTextType = (target: LwcCommonTypeClass<string>): target is JSXTextTypeClass =>
    target instanceof JSXTextTypeClass;
