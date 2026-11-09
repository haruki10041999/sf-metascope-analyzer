import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isIdentifier, type Identifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
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
import { DecoratorTypeClass } from './decorator';

const identifierTypeAnnotationPairs = lazyPairs(
    () => [typeAnnotationTypePair, tSTypeAnnotationTypePair] as const,
);

export type IdentifierFields = TypeField<'identifier'> & {
    typeAnnotation: TypeAnnotationTypeClass | TSTypeAnnotationTypeClass | null;
    optional: boolean;
    decorators: DecoratorTypeClass[] | null;
    name: Identifier['name'];
};

export class IdentifierTypeClass extends LwcCommonTypeClass<'identifier', IdentifierFields> {
    private constructor(value: FieldsOf<IdentifierFields>, sourceSpan: SourceSpan) {
        super('identifier', value, sourceSpan);
    }

    static create(target: Identifier, originalSource: string): IdentifierTypeClass {
        return new IdentifierTypeClass(
            {
                typeAnnotation: visitOptionalNode(
                    target.typeAnnotation,
                    originalSource,
                    identifierTypeAnnotationPairs(),
                    'Identifier.typeAnnotation',
                ),
                optional: target.optional ?? false,
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
                name: target.name,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): IdentifierFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): IdentifierFields['optional'] {
        return this.getFields().optional;
    }

    getDecorators(): IdentifierFields['decorators'] {
        return this.getFields().decorators;
    }

    getName(): IdentifierFields['name'] {
        return this.getFields().name;
    }
}

export const identifierTypePair: EvaluatePair<Identifier, IdentifierTypeClass> = makeEvaluatePair(
    isIdentifier,
    (target, originalSource) => IdentifierTypeClass.create(target, originalSource),
);

export const isIdentifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is IdentifierTypeClass => target instanceof IdentifierTypeClass;
