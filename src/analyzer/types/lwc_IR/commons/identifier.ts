import { isIdentifier, type Identifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
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
import { decoratorTypePair, type DecoratorTypeClass } from './decorator';

const identifierTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);
const identifierDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);

export type IdentifierFields = {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    optional: NonNullable<Identifier['optional']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
    name: Identifier['name'];
};

export class IdentifierTypeClass extends LwcCommonTypeClass<'identifier'> {
    private readonly value: IdentifierFields;

    private constructor(value: IdentifierFields) {
        super('identifier');
        this.value = value;
    }

    static create(target: Identifier, originalSource: string): IdentifierTypeClass {
        return new IdentifierTypeClass({
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                identifierTypeAnnotationPairs(),
                'Identifier.typeAnnotation',
            ),
            optional: target.optional ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          identifierDecoratorsPairs(),
                          'Identifier.decorators',
                      ),
            name: target.name,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): IdentifierFields {
        return this.value;
    }

    getTypeAnnotation(): IdentifierFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): IdentifierFields['optional'] {
        return this.value.optional;
    }

    getDecorators(): IdentifierFields['decorators'] {
        return this.value.decorators;
    }

    getName(): IdentifierFields['name'] {
        return this.value.name;
    }
}

export const identifierTypePair: EvaluatePair<Identifier, IdentifierTypeClass> = makeEvaluatePair(
    isIdentifier,
    (target, originalSource) => IdentifierTypeClass.create(target, originalSource),
);

export const isIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is IdentifierTypeClass => target instanceof IdentifierTypeClass;
