import { isJSXSpreadChild, type JSXSpreadChild } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXSpreadChildTypeClass extends LwcCommonTypeClass<'jSXSpreadChild'> {
    private constructor(originalSource: string) {
        super('jSXSpreadChild', originalSource);
    }

    static create(target: JSXSpreadChild, originalSource: string): JSXSpreadChildTypeClass {
        throw new Error('JSXSpreadChildTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXSpreadChildTypePair: EvaluatePair<JSXSpreadChild, JSXSpreadChildTypeClass> =
    makeEvaluatePair(isJSXSpreadChild, (target, originalSource) =>
        JSXSpreadChildTypeClass.create(target, originalSource),
    );

export const isJSXSpreadChildType = (
    target: LwcCommonTypeClass<string>,
): target is JSXSpreadChildTypeClass => target instanceof JSXSpreadChildTypeClass;
