import { isJSXClosingFragment, type JSXClosingFragment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXClosingFragmentTypeClass extends LwcCommonTypeClass<'jSXClosingFragment'> {
    private constructor() {
        super('jSXClosingFragment');
    }

    static create(
        _target: JSXClosingFragment,
        _originalSource: string,
    ): JSXClosingFragmentTypeClass {
        return new JSXClosingFragmentTypeClass();
    }
}

export const jSXClosingFragmentTypePair: EvaluatePair<
    JSXClosingFragment,
    JSXClosingFragmentTypeClass
> = makeEvaluatePair(isJSXClosingFragment, (target, originalSource) =>
    JSXClosingFragmentTypeClass.create(target, originalSource),
);

export const isJSXClosingFragmentType = (
    target: LwcCommonTypeClass<string>,
): target is JSXClosingFragmentTypeClass => target instanceof JSXClosingFragmentTypeClass;
