import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isArrayPattern, type ArrayPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNullableNodeList,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import { patternLikeVisitorEvaluatePairs, type PatternLikeTypeClass } from '../patternLikeVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { DecoratorTypeClass } from './decorator';

const arrayPatternTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);

export type ArrayPatternFields = TypeField<'arrayPattern'> & {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
    elements: (PatternLikeTypeClass | null)[];
};

export class ArrayPatternTypeClass extends LwcCommonTypeClass<'arrayPattern', ArrayPatternFields> {
    private constructor(value: FieldsOf<ArrayPatternFields>, sourceSpan: SourceSpan) {
        super('arrayPattern', value, sourceSpan);
    }

    static create(target: ArrayPattern, originalSource: string): ArrayPatternTypeClass {
        return new ArrayPatternTypeClass(
            {
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    arrayPatternTypeAnnotationPairs(),
                    'ArrayPattern.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                elements: visitNullableNodeList(
                    target.elements,
                    originalSource,
                    patternLikeVisitorEvaluatePairs(),
                    'PatternLikeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): ArrayPatternFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): ArrayPatternFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): ArrayPatternFields['decorators'] {
        return this.getFields().decorators;
    }

    getElements(): ArrayPatternFields['elements'] {
        return this.getFields().elements;
    }
}

export const arrayPatternTypePair: EvaluatePair<ArrayPattern, ArrayPatternTypeClass> =
    makeEvaluatePair(isArrayPattern, (target, originalSource) =>
        ArrayPatternTypeClass.create(target, originalSource),
    );

export const isArrayPatternType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ArrayPatternTypeClass => target instanceof ArrayPatternTypeClass;
