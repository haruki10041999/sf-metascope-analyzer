import { isPlaceholder, type Placeholder } from '@babel/types';
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
import { decoratorTypePair, type DecoratorTypeClass } from '../commons/decorator';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';

const placeholderNamePairs = lazyPairs(() => [identifierTypePair] as const);
const placeholderTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const placeholderDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);

export type PlaceholderFields = {
    name: IdentifierTypeClass | LwcErrorTypeClass;
    expectedNode: Placeholder['expectedNode'];
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<Placeholder['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
};

export class PlaceholderTypeClass extends LwcCommonTypeClass<'placeholder'> {
    private readonly value: PlaceholderFields;

    private constructor(value: PlaceholderFields) {
        super('placeholder');
        this.value = value;
    }

    static create(target: Placeholder, originalSource: string): PlaceholderTypeClass {
        return new PlaceholderTypeClass({
            name: visitNode(
                target.name,
                originalSource,
                placeholderNamePairs(),
                'Placeholder.name',
            ),
            expectedNode: target.expectedNode,
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                placeholderTypeAnnotationPairs(),
                'Placeholder.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          placeholderDecoratorsPairs(),
                          'Placeholder.decorators',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): PlaceholderFields {
        return this.value;
    }

    getName(): PlaceholderFields['name'] {
        return this.value.name;
    }

    getExpectedNode(): PlaceholderFields['expectedNode'] {
        return this.value.expectedNode;
    }

    getTypeAnnotation(): PlaceholderFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): PlaceholderFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): PlaceholderFields['decorators'] {
        return this.value.decorators;
    }
}

export const placeholderTypePair: EvaluatePair<Placeholder, PlaceholderTypeClass> =
    makeEvaluatePair(isPlaceholder, (target, originalSource) =>
        PlaceholderTypeClass.create(target, originalSource),
    );

export const isPlaceholderType = (
    target: LwcCommonTypeClass<string>,
): target is PlaceholderTypeClass => target instanceof PlaceholderTypeClass;
