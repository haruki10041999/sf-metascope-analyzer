import { isRestProperty, type Node, type RestProperty } from '@babel/types';
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

// 非推奨の別名。Babel 8 の parse は作らず RestElement を使う。isRestProperty は型の判定 (target is ...) にならないので包む
const isRestPropertyNode = (target: Node | null | undefined): target is RestProperty =>
    isRestProperty(target);

const restPropertyArgumentPairs = lazyPairs(
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
const restPropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);
const restPropertyTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);

export type RestPropertyFields = {
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
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    optional: NonNullable<RestProperty['optional']> | null;
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
};

export class RestPropertyTypeClass extends LwcCommonTypeClass<'restProperty'> {
    private readonly value: RestPropertyFields;

    private constructor(value: RestPropertyFields) {
        super('restProperty');
        this.value = value;
    }

    static create(target: RestProperty, originalSource: string): RestPropertyTypeClass {
        return new RestPropertyTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                restPropertyArgumentPairs(),
                'RestProperty.argument',
            ),
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          restPropertyDecoratorsPairs(),
                          'RestProperty.decorators',
                      ),
            optional: target.optional ?? null,
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                restPropertyTypeAnnotationPairs(),
                'RestProperty.typeAnnotation',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): RestPropertyFields {
        return this.value;
    }

    getArgument(): RestPropertyFields['argument'] {
        return this.value.argument;
    }

    getDecorators(): RestPropertyFields['decorators'] {
        return this.value.decorators;
    }

    getOptional(): RestPropertyFields['optional'] {
        return this.value.optional;
    }

    getTypeAnnotation(): RestPropertyFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const restPropertyTypePair: EvaluatePair<RestProperty, RestPropertyTypeClass> =
    makeEvaluatePair(isRestPropertyNode, (target, originalSource) =>
        RestPropertyTypeClass.create(target, originalSource),
    );

export const isRestPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is RestPropertyTypeClass => target instanceof RestPropertyTypeClass;
