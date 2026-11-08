import { isJSXFragment, type JSXFragment } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import { jSXClosingFragmentTypePair, type JSXClosingFragmentTypeClass } from './jSXClosingFragment';
import { jSXElementTypePair, type JSXElementTypeClass } from './jSXElement';
import {
    jSXExpressionContainerTypePair,
    type JSXExpressionContainerTypeClass,
} from './jSXExpressionContainer';
import { jSXOpeningFragmentTypePair, type JSXOpeningFragmentTypeClass } from './jSXOpeningFragment';
import { jSXSpreadChildTypePair, type JSXSpreadChildTypeClass } from './jSXSpreadChild';
import { jSXTextTypePair, type JSXTextTypeClass } from './jSXText';

const jSXFragmentOpeningFragmentPairs = lazyPairs(() => [jSXOpeningFragmentTypePair] as const);
const jSXFragmentClosingFragmentPairs = lazyPairs(() => [jSXClosingFragmentTypePair] as const);
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

export type JSXFragmentFields = {
    openingFragment: JSXOpeningFragmentTypeClass | LwcErrorTypeClass;
    closingFragment: JSXClosingFragmentTypeClass | LwcErrorTypeClass;
    children: (
        | JSXTextTypeClass
        | JSXExpressionContainerTypeClass
        | JSXSpreadChildTypeClass
        | JSXElementTypeClass
        | JSXFragmentTypeClass
        | LwcErrorTypeClass
    )[];
};

export class JSXFragmentTypeClass extends LwcCommonTypeClass<'jSXFragment'> {
    private readonly value: JSXFragmentFields;

    private constructor(value: JSXFragmentFields) {
        super('jSXFragment');
        this.value = value;
    }

    static create(target: JSXFragment, originalSource: string): JSXFragmentTypeClass {
        return new JSXFragmentTypeClass({
            openingFragment: visitNode(
                target.openingFragment,
                originalSource,
                jSXFragmentOpeningFragmentPairs(),
                'JSXFragment.openingFragment',
            ),
            closingFragment: visitNode(
                target.closingFragment,
                originalSource,
                jSXFragmentClosingFragmentPairs(),
                'JSXFragment.closingFragment',
            ),
            children: visitNodeList(
                target.children,
                originalSource,
                jSXFragmentChildrenPairs(),
                'JSXFragment.children',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXFragmentFields {
        return this.value;
    }

    getOpeningFragment(): JSXFragmentFields['openingFragment'] {
        return this.value.openingFragment;
    }

    getClosingFragment(): JSXFragmentFields['closingFragment'] {
        return this.value.closingFragment;
    }

    getChildren(): JSXFragmentFields['children'] {
        return this.value.children;
    }
}

export const jSXFragmentTypePair: EvaluatePair<JSXFragment, JSXFragmentTypeClass> =
    makeEvaluatePair(isJSXFragment, (target, originalSource) =>
        JSXFragmentTypeClass.create(target, originalSource),
    );

export const isJSXFragmentType = (
    target: LwcCommonTypeClass<string>,
): target is JSXFragmentTypeClass => target instanceof JSXFragmentTypeClass;
