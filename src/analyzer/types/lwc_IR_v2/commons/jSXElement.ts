import { isJSXElement, type JSXElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import { jSXClosingElementTypePair, type JSXClosingElementTypeClass } from './jSXClosingElement';
import {
    jSXExpressionContainerTypePair,
    type JSXExpressionContainerTypeClass,
} from './jSXExpressionContainer';
import { jSXFragmentTypePair, type JSXFragmentTypeClass } from './jSXFragment';
import { jSXOpeningElementTypePair, type JSXOpeningElementTypeClass } from './jSXOpeningElement';
import { jSXSpreadChildTypePair, type JSXSpreadChildTypeClass } from './jSXSpreadChild';
import { jSXTextTypePair, type JSXTextTypeClass } from './jSXText';

const jSXElementOpeningElementPairs = lazyPairs(() => [jSXOpeningElementTypePair] as const);
const jSXElementClosingElementPairs = lazyPairs(() => [jSXClosingElementTypePair] as const);
const jSXElementChildrenPairs = lazyPairs(
    () =>
        [
            jSXTextTypePair,
            jSXExpressionContainerTypePair,
            jSXSpreadChildTypePair,
            jSXElementTypePair,
            jSXFragmentTypePair,
        ] as const,
);

export type JSXElementFields = {
    openingElement: JSXOpeningElementTypeClass | LwcErrorTypeClass;
    closingElement: JSXClosingElementTypeClass | LwcErrorTypeClass | null;
    children: (
        | JSXTextTypeClass
        | JSXExpressionContainerTypeClass
        | JSXSpreadChildTypeClass
        | JSXElementTypeClass
        | JSXFragmentTypeClass
        | LwcErrorTypeClass
    )[];
};

export class JSXElementTypeClass extends LwcCommonTypeClass<'jSXElement'> {
    private readonly value: JSXElementFields;

    private constructor(value: JSXElementFields) {
        super('jSXElement');
        this.value = value;
    }

    static create(target: JSXElement, originalSource: string): JSXElementTypeClass {
        return new JSXElementTypeClass({
            openingElement: visitNode(
                target.openingElement,
                originalSource,
                jSXElementOpeningElementPairs(),
                'JSXElement.openingElement',
            ),
            closingElement: visitOptionalNode(
                target.closingElement,
                originalSource,
                jSXElementClosingElementPairs(),
                'JSXElement.closingElement',
            ),
            children: visitNodeList(
                target.children,
                originalSource,
                jSXElementChildrenPairs(),
                'JSXElement.children',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXElementFields {
        return this.value;
    }

    getOpeningElement(): JSXElementFields['openingElement'] {
        return this.value.openingElement;
    }

    getClosingElement(): JSXElementFields['closingElement'] {
        return this.value.closingElement;
    }

    getChildren(): JSXElementFields['children'] {
        return this.value.children;
    }
}

export const jSXElementTypePair: EvaluatePair<JSXElement, JSXElementTypeClass> = makeEvaluatePair(
    isJSXElement,
    (target, originalSource) => JSXElementTypeClass.create(target, originalSource),
);

export const isJSXElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXElementTypeClass => target instanceof JSXElementTypeClass;
