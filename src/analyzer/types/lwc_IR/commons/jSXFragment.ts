import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXFragment, type JSXFragment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { JSXClosingFragmentTypeClass } from './jSXClosingFragment';
import { jSXElementTypePair, type JSXElementTypeClass } from './jSXElement';
import {
    jSXExpressionContainerTypePair,
    type JSXExpressionContainerTypeClass,
} from './jSXExpressionContainer';
import { JSXOpeningFragmentTypeClass } from './jSXOpeningFragment';
import { jSXSpreadChildTypePair, type JSXSpreadChildTypeClass } from './jSXSpreadChild';
import { jSXTextTypePair, type JSXTextTypeClass } from './jSXText';

const jSXFragmentChildrenPairs = lazyPairs(
    () =>
        [
            jSXTextTypePair,
            jSXExpressionContainerTypePair,
            jSXSpreadChildTypePair,
            jSXElementTypePair,
            jSXFragmentTypePair,
        ] as const,
);

export type JSXFragmentFields = TypeField<'jSXFragment'> & {
    openingFragment: JSXOpeningFragmentTypeClass;
    closingFragment: JSXClosingFragmentTypeClass;
    children: (
        | JSXTextTypeClass
        | JSXExpressionContainerTypeClass
        | JSXSpreadChildTypeClass
        | JSXElementTypeClass
        | JSXFragmentTypeClass
    )[];
};

export class JSXFragmentTypeClass extends LwcCommonTypeClass<'jSXFragment', JSXFragmentFields> {
    private constructor(value: FieldsOf<JSXFragmentFields>, sourceSpan: SourceSpan) {
        super('jSXFragment', value, sourceSpan);
    }

    static create(target: JSXFragment, originalSource: string): JSXFragmentTypeClass {
        return new JSXFragmentTypeClass(
            {
                openingFragment: JSXOpeningFragmentTypeClass.create(
                    target.openingFragment,
                    originalSource,
                ),
                closingFragment: JSXClosingFragmentTypeClass.create(
                    target.closingFragment,
                    originalSource,
                ),
                children: visitNodeList(
                    target.children,
                    originalSource,
                    jSXFragmentChildrenPairs(),
                    'JSXFragment.children',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getOpeningFragment(): JSXFragmentFields['openingFragment'] {
        return this.getFields().openingFragment;
    }

    getClosingFragment(): JSXFragmentFields['closingFragment'] {
        return this.getFields().closingFragment;
    }

    getChildren(): JSXFragmentFields['children'] {
        return this.getFields().children;
    }
}

export const jSXFragmentTypePair: EvaluatePair<JSXFragment, JSXFragmentTypeClass> =
    makeEvaluatePair(isJSXFragment, (target, originalSource) =>
        JSXFragmentTypeClass.create(target, originalSource),
    );

export const isJSXFragmentType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXFragmentTypeClass => target instanceof JSXFragmentTypeClass;
