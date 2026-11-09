import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeAnnotation, type TSTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSReturnTypeVisitorEvaluatePairs, type TSReturnTypeTypeClass } from '../tsTypeVisitor';

/**
 * 型注釈 (`: T`)。引数・変数の型注釈と戻り値の型注釈で同じノードを使うため、
 * 戻り値にだけ書ける型の述語 (`x is T`・`asserts x`) も含む
 */
export type TSTypeAnnotationFields = TypeField<'tSTypeAnnotation'> & {
    typeAnnotation: TSReturnTypeTypeClass;
};

export class TSTypeAnnotationTypeClass extends LwcCommonTypeClass<
    'tSTypeAnnotation',
    TSTypeAnnotationFields
> {
    private constructor(value: FieldsOf<TSTypeAnnotationFields>, sourceSpan: SourceSpan) {
        super('tSTypeAnnotation', value, sourceSpan);
    }

    static create(target: TSTypeAnnotation, originalSource: string): TSTypeAnnotationTypeClass {
        return new TSTypeAnnotationTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSReturnTypeVisitorEvaluatePairs(),
                    'TSTypeAnnotation.typeAnnotation',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TSTypeAnnotationFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSTypeAnnotationTypePair: EvaluatePair<TSTypeAnnotation, TSTypeAnnotationTypeClass> =
    makeEvaluatePair(isTSTypeAnnotation, (target, originalSource) =>
        TSTypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTSTypeAnnotationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeAnnotationTypeClass => target instanceof TSTypeAnnotationTypeClass;
