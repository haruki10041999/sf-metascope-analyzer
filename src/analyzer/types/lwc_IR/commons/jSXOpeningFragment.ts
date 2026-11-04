import { isJSXOpeningFragment, type JSXOpeningFragment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXOpeningFragmentTypeClass extends LwcCommonTypeClass<'jSXOpeningFragment'> {
    private constructor(originalSource: string) {
        super('jSXOpeningFragment', originalSource);
    }

    static create(target: JSXOpeningFragment, originalSource: string): JSXOpeningFragmentTypeClass {
        throw new Error('JSXOpeningFragmentTypeClass.create is not implemented: ' + target.type);
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
