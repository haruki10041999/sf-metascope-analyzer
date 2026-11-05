import { isJSXOpeningFragment, type JSXOpeningFragment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXOpeningFragmentTypeClass extends LwcCommonTypeClass<'jSXOpeningFragment'> {
    private constructor() {
        super('jSXOpeningFragment');
    }

    static create(
        _target: JSXOpeningFragment,
        _originalSource: string,
    ): JSXOpeningFragmentTypeClass {
        return new JSXOpeningFragmentTypeClass();
    }
}

export const jSXOpeningFragmentTypePair: EvaluatePair<
    JSXOpeningFragment,
    JSXOpeningFragmentTypeClass
> = makeEvaluatePair(isJSXOpeningFragment, (target, originalSource) =>
    JSXOpeningFragmentTypeClass.create(target, originalSource),
);

export const isJSXOpeningFragmentType = (
    target: LwcCommonTypeClass<string>,
): target is JSXOpeningFragmentTypeClass => target instanceof JSXOpeningFragmentTypeClass;
