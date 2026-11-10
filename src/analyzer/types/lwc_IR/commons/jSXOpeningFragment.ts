import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXOpeningFragment, type JSXOpeningFragment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type JSXOpeningFragmentFields = TypeField<'jSXOpeningFragment'>;

export class JSXOpeningFragmentTypeClass extends LwcCommonTypeClass<
    'jSXOpeningFragment',
    JSXOpeningFragmentFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('jSXOpeningFragment', {}, sourceSpan);
    }

    static create(target: JSXOpeningFragment, originalSource: string): JSXOpeningFragmentTypeClass {
        return new JSXOpeningFragmentTypeClass(getSourceSpan(target, originalSource));
    }
}

export const jSXOpeningFragmentTypePair: EvaluatePair<
    JSXOpeningFragment,
    JSXOpeningFragmentTypeClass
> = makeEvaluatePair(isJSXOpeningFragment, (target, originalSource) =>
    JSXOpeningFragmentTypeClass.create(target, originalSource),
);

export const isJSXOpeningFragmentType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXOpeningFragmentTypeClass => target instanceof JSXOpeningFragmentTypeClass;
