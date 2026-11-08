import { isQualifiedTypeIdentifier, type QualifiedTypeIdentifier } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';

const qualifiedTypeIdentifierIdPairs = lazyPairs(() => [identifierTypePair] as const);
const qualifiedTypeIdentifierQualificationPairs = lazyPairs(
    () => [identifierTypePair, qualifiedTypeIdentifierTypePair] as const,
);

export type QualifiedTypeIdentifierFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    qualification: IdentifierTypeClass | QualifiedTypeIdentifierTypeClass | LwcErrorTypeClass;
};

export class QualifiedTypeIdentifierTypeClass extends LwcCommonTypeClass<'qualifiedTypeIdentifier'> {
    private readonly value: QualifiedTypeIdentifierFields;

    private constructor(value: QualifiedTypeIdentifierFields) {
        super('qualifiedTypeIdentifier');
        this.value = value;
    }

    static create(
        target: QualifiedTypeIdentifier,
        originalSource: string,
    ): QualifiedTypeIdentifierTypeClass {
        return new QualifiedTypeIdentifierTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                qualifiedTypeIdentifierIdPairs(),
                'QualifiedTypeIdentifier.id',
            ),
            qualification: visitNode(
                target.qualification,
                originalSource,
                qualifiedTypeIdentifierQualificationPairs(),
                'QualifiedTypeIdentifier.qualification',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): QualifiedTypeIdentifierFields {
        return this.value;
    }

    getId(): QualifiedTypeIdentifierFields['id'] {
        return this.value.id;
    }

    getQualification(): QualifiedTypeIdentifierFields['qualification'] {
        return this.value.qualification;
    }
}

export const qualifiedTypeIdentifierTypePair: EvaluatePair<
    QualifiedTypeIdentifier,
    QualifiedTypeIdentifierTypeClass
> = makeEvaluatePair(isQualifiedTypeIdentifier, (target, originalSource) =>
    QualifiedTypeIdentifierTypeClass.create(target, originalSource),
);

export const isQualifiedTypeIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is QualifiedTypeIdentifierTypeClass => target instanceof QualifiedTypeIdentifierTypeClass;
