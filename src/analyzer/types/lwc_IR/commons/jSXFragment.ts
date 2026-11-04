import { isJSXFragment, type JSXFragment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXFragmentTypeClass extends LwcCommonTypeClass<'jSXFragment'> {
    private constructor(originalSource: string) {
        super('jSXFragment', originalSource);
    }

    static create(target: JSXFragment, originalSource: string): JSXFragmentTypeClass {
        throw new Error('JSXFragmentTypeClass.create is not implemented: ' + target.type);
    }
}

export const jSXFragmentTypePair: EvaluatePair<JSXFragment, JSXFragmentTypeClass> =
    makeEvaluatePair(isJSXFragment, (target, originalSource) =>
        JSXFragmentTypeClass.create(target, originalSource),
    );

export const isJSXFragmentType = (
    target: LwcCommonTypeClass<string>,
): target is JSXFragmentTypeClass => target instanceof JSXFragmentTypeClass;
