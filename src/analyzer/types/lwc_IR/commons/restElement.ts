import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isRestElement, type RestElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { DecoratorTypeClass } from './decorator';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import { memberExpressionTypePair, type MemberExpressionTypeClass } from './memberExpression';
import { objectPatternTypePair, type ObjectPatternTypeClass } from './objectPattern';
import { tSAsExpressionTypePair, type TSAsExpressionTypeClass } from './tSAsExpression';
import {
    tSNonNullExpressionTypePair,
    type TSNonNullExpressionTypeClass,
} from './tSNonNullExpression';
import {
    tSSatisfiesExpressionTypePair,
    type TSSatisfiesExpressionTypeClass,
} from './tSSatisfiesExpression';
import { tSTypeAssertionTypePair, type TSTypeAssertionTypeClass } from './tSTypeAssertion';

const restElementTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const restElementArgumentPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            memberExpressionTypePair,
            tSAsExpressionTypePair,
            tSSatisfiesExpressionTypePair,
            tSTypeAssertionTypePair,
            tSNonNullExpressionTypePair,
        ] as const,
);

export type RestElementFields = TypeField<'restElement'> & {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
    argument:
        | IdentifierTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | MemberExpressionTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass;
};

export class RestElementTypeClass extends LwcCommonTypeClass<'restElement', RestElementFields> {
    private constructor(value: FieldsOf<RestElementFields>, sourceSpan: SourceSpan) {
        super('restElement', value, sourceSpan);
    }

    static create(target: RestElement, originalSource: string): RestElementTypeClass {
        return new RestElementTypeClass(
            {
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    restElementTypeAnnotationPairs(),
                    'RestElement.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                argument: visitNode(
                    target.argument,
                    originalSource,
                    restElementArgumentPairs(),
                    'RestElement.argument',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): RestElementFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): RestElementFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): RestElementFields['decorators'] {
        return this.getFields().decorators;
    }

    getArgument(): RestElementFields['argument'] {
        return this.getFields().argument;
    }
}

export const restElementTypePair: EvaluatePair<RestElement, RestElementTypeClass> =
    makeEvaluatePair(isRestElement, (target, originalSource) =>
        RestElementTypeClass.create(target, originalSource),
    );

export const isRestElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is RestElementTypeClass => target instanceof RestElementTypeClass;
