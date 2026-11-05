import { isArrayPattern, type ArrayPattern } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitNullableNodeList,
    visitOptionalNode,
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
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';

const arrayPatternTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const arrayPatternDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);

export type ArrayPatternFields = {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<ArrayPattern['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    elements: (PatternLikeTypeClass | LwcErrorTypeClass | null)[];
};

export class ArrayPatternTypeClass extends LwcCommonTypeClass<'arrayPattern'> {
    private readonly value: ArrayPatternFields;

    private constructor(value: ArrayPatternFields) {
        super('arrayPattern');
        this.value = value;
    }

    static create(target: ArrayPattern, originalSource: string): ArrayPatternTypeClass {
        return new ArrayPatternTypeClass({
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                arrayPatternTypeAnnotationPairs(),
                'ArrayPattern.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          arrayPatternDecoratorsPairs(),
                          'ArrayPattern.decorators',
                      ),
            elements: visitNullableNodeList(
                target.elements,
                originalSource,
                patternLikeVisitorEvaluatePairs(),
                'PatternLikeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ArrayPatternFields {
        return this.value;
    }

    getTypeAnnotation(): ArrayPatternFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): ArrayPatternFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): ArrayPatternFields['decorators'] {
        return this.value.decorators;
    }

    getElements(): ArrayPatternFields['elements'] {
        return this.value.elements;
    }
}

export const arrayPatternTypePair: EvaluatePair<ArrayPattern, ArrayPatternTypeClass> =
    makeEvaluatePair(isArrayPattern, (target, originalSource) =>
        ArrayPatternTypeClass.create(target, originalSource),
    );

export const isArrayPatternType = (
    target: LwcCommonTypeClass<string>,
): target is ArrayPatternTypeClass => target instanceof ArrayPatternTypeClass;
