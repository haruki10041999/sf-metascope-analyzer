import { isJSXClosingFragment, type JSXClosingFragment } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class JSXClosingFragmentTypeClass extends LwcCommonTypeClass<'jSXClosingFragment'> {
    private constructor(originalSource: string) {
        super('jSXClosingFragment', originalSource);
    }

    static create(target: JSXClosingFragment, originalSource: string): JSXClosingFragmentTypeClass {
        throw new Error('JSXClosingFragmentTypeClass.create is not implemented: ' + target.type);
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
