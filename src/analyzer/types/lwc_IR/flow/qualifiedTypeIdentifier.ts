import { isQualifiedTypeIdentifier, type QualifiedTypeIdentifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class QualifiedTypeIdentifierTypeClass extends LwcCommonTypeClass<'qualifiedTypeIdentifier'> {
    private constructor(originalSource: string) {
        super('qualifiedTypeIdentifier', originalSource);
    }

    static create(
        target: QualifiedTypeIdentifier,
        originalSource: string,
    ): QualifiedTypeIdentifierTypeClass {
        throw new Error(
            'QualifiedTypeIdentifierTypeClass.create is not implemented: ' + target.type,
        );
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
