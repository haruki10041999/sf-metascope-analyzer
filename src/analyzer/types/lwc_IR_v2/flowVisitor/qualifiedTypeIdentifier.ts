import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isQualifiedTypeIdentifier, type QualifiedTypeIdentifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, IdentifierTypeClass } from '../commons/identifier';

const qualifiedTypeIdentifierQualificationPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);

export type QualifiedTypeIdentifierFields = TypeField<'qualifiedTypeIdentifier'> & {
    id: IdentifierTypeClass;
    qualification: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass;
};

export class QualifiedTypeIdentifierTypeClass extends LwcCommonTypeClass<
    'qualifiedTypeIdentifier',
    QualifiedTypeIdentifierFields
> {
    private constructor(value: FieldsOf<QualifiedTypeIdentifierFields>, sourceSpan: SourceSpan) {
        super('qualifiedTypeIdentifier', value, sourceSpan);
    }

    static create(
        target: QualifiedTypeIdentifier,
        originalSource: string,
    ): QualifiedTypeIdentifierTypeClass {
        return new QualifiedTypeIdentifierTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                qualification: visitNode(
                    target.qualification,
                    originalSource,
                    qualifiedTypeIdentifierQualificationPairs(),
                    'QualifiedTypeIdentifier.qualification',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): QualifiedTypeIdentifierFields['id'] {
        return this.getFields().id;
    }

    getQualification(): QualifiedTypeIdentifierFields['qualification'] {
        return this.getFields().qualification;
    }
}

export const qualifiedTypeIdentifierTypePair: EvaluatePair<
    QualifiedTypeIdentifier,
    QualifiedTypeIdentifierTypeClass
> = makeEvaluatePair(isQualifiedTypeIdentifier, (target, originalSource) =>
    QualifiedTypeIdentifierTypeClass.create(target, originalSource),
);

export const isQualifiedTypeIdentifierType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is QualifiedTypeIdentifierTypeClass => target instanceof QualifiedTypeIdentifierTypeClass;
