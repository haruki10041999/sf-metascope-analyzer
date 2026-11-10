import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNamedTupleMember, isTSRestType, isTSTupleType, type TSTupleType } from '@babel/types';
import { failIrBuild } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { tSNamedTupleMemberTypePair, type TSNamedTupleMemberTypeClass } from './tSNamedTupleMember';
import { tSOptionalTypeTypePair, type TSOptionalTypeTypeClass } from './tSOptionalType';
import { tSRestTypeTypePair, type TSRestTypeTypeClass } from './tSRestType';

const tSTupleTypeUnnamedElementPairs = lazyPairs(
    () => [...tSTypeVisitorEvaluatePairs(), tSOptionalTypeTypePair, tSRestTypeTypePair] as const,
);
const tSTupleTypeNamedElementPairs = lazyPairs(
    () => [tSNamedTupleMemberTypePair, tSRestTypeTypePair] as const,
);

/**
 * 名前付きの要素 (`[a: T, b?: U]`) と名前のない要素 (`[T, U?]`) は混ぜられない。
 * - unnamed: 型・省略できる型 (`T?`)・rest (`...T[]`)
 * - named: 名前付きの要素・ラベル付きの rest (`...rest: T[]`)
 */
export type TSTupleTypeFields = TypeField<'tSTupleType'> &
    (
        | {
              kind: 'unnamed';
              elements: (TSTypeTypeClass | TSOptionalTypeTypeClass | TSRestTypeTypeClass)[];
          }
        | { kind: 'named'; elements: (TSNamedTupleMemberTypeClass | TSRestTypeTypeClass)[] }
    );

/** 要素が名前付きか (ラベル付きの rest も名前付き) */
const isNamedElement = (element: TSTupleType['elementTypes'][number]): boolean =>
    isTSNamedTupleMember(element) ||
    (isTSRestType(element) && isTSNamedTupleMember(element.typeAnnotation));

export class TSTupleTypeTypeClass extends LwcCommonTypeClass<'tSTupleType', TSTupleTypeFields> {
    private constructor(value: FieldsOf<TSTupleTypeFields>, sourceSpan: SourceSpan) {
        super('tSTupleType', value, sourceSpan);
    }

    static create(target: TSTupleType, originalSource: string): TSTupleTypeTypeClass {
        const namedCount = target.elementTypes.filter(isNamedElement).length;
        if (namedCount > 0 && namedCount < target.elementTypes.length) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'タプルの名前付きの要素と名前のない要素は混ぜられません',
            );
        }
        return new TSTupleTypeTypeClass(
            namedCount > 0
                ? {
                      kind: 'named',
                      elements: visitNodeList(
                          target.elementTypes,
                          originalSource,
                          tSTupleTypeNamedElementPairs(),
                          'TSTupleType.elementTypes',
                      ),
                  }
                : {
                      kind: 'unnamed',
                      elements: visitNodeList(
                          target.elementTypes,
                          originalSource,
                          tSTupleTypeUnnamedElementPairs(),
                          'TSTupleType.elementTypes',
                      ),
                  },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): TSTupleTypeFields['kind'] {
        return this.getFields().kind;
    }

    getElements(): TSTupleTypeFields['elements'] {
        return this.getFields().elements;
    }
}

export const tSTupleTypeTypePair: EvaluatePair<TSTupleType, TSTupleTypeTypeClass> =
    makeEvaluatePair(isTSTupleType, (target, originalSource) =>
        TSTupleTypeTypeClass.create(target, originalSource),
    );

export const isTSTupleTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTupleTypeTypeClass => target instanceof TSTupleTypeTypeClass;
