import { isRestElement, type RestElement } from '@babel/types';
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
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import { arrayPatternTypePair, type ArrayPatternTypeClass } from './arrayPattern';
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';
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
const restElementDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
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

export type RestElementFields = {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<RestElement['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    argument:
        | IdentifierTypeClass
        | ArrayPatternTypeClass
        | ObjectPatternTypeClass
        | MemberExpressionTypeClass
        | TSAsExpressionTypeClass
        | TSSatisfiesExpressionTypeClass
        | TSTypeAssertionTypeClass
        | TSNonNullExpressionTypeClass
        | LwcErrorTypeClass;
};

export class RestElementTypeClass extends LwcCommonTypeClass<'restElement'> {
    private readonly value: RestElementFields;

    private constructor(value: RestElementFields) {
        super('restElement');
        this.value = value;
    }

    static create(target: RestElement, originalSource: string): RestElementTypeClass {
        return new RestElementTypeClass({
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                restElementTypeAnnotationPairs(),
                'RestElement.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          restElementDecoratorsPairs(),
                          'RestElement.decorators',
                      ),
            argument: visitNode(
                target.argument,
                originalSource,
                restElementArgumentPairs(),
                'RestElement.argument',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): RestElementFields {
        return this.value;
    }

    getTypeAnnotation(): RestElementFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): RestElementFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): RestElementFields['decorators'] {
        return this.value.decorators;
    }

    getArgument(): RestElementFields['argument'] {
        return this.value.argument;
    }
}

export const restElementTypePair: EvaluatePair<RestElement, RestElementTypeClass> =
    makeEvaluatePair(isRestElement, (target, originalSource) =>
        RestElementTypeClass.create(target, originalSource),
    );

export const isRestElementType = (
    target: LwcCommonTypeClass<string>,
): target is RestElementTypeClass => target instanceof RestElementTypeClass;
