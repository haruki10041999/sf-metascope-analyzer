import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXElement, type JSXElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import { JSXClosingElementTypeClass } from './jSXClosingElement';
import {
    jSXExpressionContainerTypePair,
    type JSXExpressionContainerTypeClass,
} from './jSXExpressionContainer';
import { jSXFragmentTypePair, type JSXFragmentTypeClass } from './jSXFragment';
import { JSXOpeningElementTypeClass } from './jSXOpeningElement';
import { jSXSpreadChildTypePair, type JSXSpreadChildTypeClass } from './jSXSpreadChild';
import { jSXTextTypePair, type JSXTextTypeClass } from './jSXText';

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

export type JSXChildTypeClass =
    | JSXTextTypeClass
    | JSXExpressionContainerTypeClass
    | JSXSpreadChildTypeClass
    | JSXElementTypeClass
    | JSXFragmentTypeClass;

/** 自己終了の要素 (`<a />`) は閉じタグも子も持たない */
export type JSXElementFields = TypeField<'jSXElement'> & {
    openingElement: JSXOpeningElementTypeClass;
} & (
        | { selfClosing: true; closingElement: null; children: [] }
        | {
              selfClosing: false;
              closingElement: JSXClosingElementTypeClass;
              children: JSXChildTypeClass[];
          }
    );

export class JSXElementTypeClass extends LwcCommonTypeClass<'jSXElement', JSXElementFields> {
    private constructor(value: FieldsOf<JSXElementFields>, sourceSpan: SourceSpan) {
        super('jSXElement', value, sourceSpan);
    }

    static create(target: JSXElement, originalSource: string): JSXElementTypeClass {
        const openingElement = JSXOpeningElementTypeClass.create(
            target.openingElement,
            originalSource,
        );
        if (target.openingElement.selfClosing) {
            return target.closingElement == null && target.children.length === 0
                ? new JSXElementTypeClass(
                      { openingElement, selfClosing: true, closingElement: null, children: [] },
                      getSourceSpan(target, originalSource),
                  )
                : failIrBuild(
                      'TYPE_MISMATCH',
                      target,
                      originalSource,
                      '自己終了の要素は閉じタグも子も持ちません',
                  );
        }
        return new JSXElementTypeClass(
            {
                openingElement,
                selfClosing: false,
                closingElement:
                    target.closingElement == null
                        ? failIrBuild(
                              'TYPE_MISMATCH',
                              target,
                              originalSource,
                              '自己終了でない要素には閉じタグが要ります',
                          )
                        : JSXClosingElementTypeClass.create(target.closingElement, originalSource),
                children: visitNodeList(
                    target.children,
                    originalSource,
                    jSXElementChildrenPairs(),
                    'JSXElement.children',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getOpeningElement(): JSXElementFields['openingElement'] {
        return this.getFields().openingElement;
    }

    getSelfClosing(): JSXElementFields['selfClosing'] {
        return this.getFields().selfClosing;
    }

    getClosingElement(): JSXElementFields['closingElement'] {
        return this.getFields().closingElement;
    }

    getChildren(): JSXElementFields['children'] {
        return this.getFields().children;
    }
}

export const jSXElementTypePair: EvaluatePair<JSXElement, JSXElementTypeClass> = makeEvaluatePair(
    isJSXElement,
    (target, originalSource) => JSXElementTypeClass.create(target, originalSource),
);

export const isJSXElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXElementTypeClass => target instanceof JSXElementTypeClass;
