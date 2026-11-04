import { isIdentifier, type Identifier } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class IdentifierTypeClass extends LwcCommonTypeClass<'identifier'> {
    private constructor(originalSource: string) {
        super('identifier', originalSource);
    }

    static create(target: Identifier, originalSource: string): IdentifierTypeClass {
        throw new Error('IdentifierTypeClass.create is not implemented: ' + target.type);
    }
}

export const identifierTypePair: EvaluatePair<Identifier, IdentifierTypeClass> = makeEvaluatePair(
    isIdentifier,
    (target, originalSource) => IdentifierTypeClass.create(target, originalSource),
);

export const isIdentifierType = (
    target: LwcCommonTypeClass<string>,
): target is IdentifierTypeClass => target instanceof IdentifierTypeClass;
