import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXClosingFragment, type JSXClosingFragment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type JSXClosingFragmentFields = TypeField<'jSXClosingFragment'>;

export class JSXClosingFragmentTypeClass extends LwcCommonTypeClass<
    'jSXClosingFragment',
    JSXClosingFragmentFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('jSXClosingFragment', {}, sourceSpan);
    }

    static create(target: JSXClosingFragment, originalSource: string): JSXClosingFragmentTypeClass {
        return new JSXClosingFragmentTypeClass(getSourceSpan(target, originalSource));
    }
}

export const jSXClosingFragmentTypePair: EvaluatePair<
    JSXClosingFragment,
    JSXClosingFragmentTypeClass
> = makeEvaluatePair(isJSXClosingFragment, (target, originalSource) =>
    JSXClosingFragmentTypeClass.create(target, originalSource),
);

export const isJSXClosingFragmentType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXClosingFragmentTypeClass => target instanceof JSXClosingFragmentTypeClass;
