import { isTSTypeAnnotation, type TSTypeAnnotation } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeAnnotationFields = {
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSTypeAnnotationTypeClass extends LwcCommonTypeClass<'tSTypeAnnotation'> {
    private readonly value: TSTypeAnnotationFields;

    private constructor(value: TSTypeAnnotationFields) {
        super('tSTypeAnnotation');
        this.value = value;
    }

    static create(target: TSTypeAnnotation, originalSource: string): TSTypeAnnotationTypeClass {
        return new TSTypeAnnotationTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeAnnotationFields {
        return this.value;
    }

    getTypeAnnotation(): TSTypeAnnotationFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSTypeAnnotationTypePair: EvaluatePair<TSTypeAnnotation, TSTypeAnnotationTypeClass> =
    makeEvaluatePair(isTSTypeAnnotation, (target, originalSource) =>
        TSTypeAnnotationTypeClass.create(target, originalSource),
    );

export const isTSTypeAnnotationType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeAnnotationTypeClass => target instanceof TSTypeAnnotationTypeClass;
