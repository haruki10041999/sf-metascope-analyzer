import { isDirectiveLiteral, type DirectiveLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DirectiveLiteralTypeClass extends LwcCommonTypeClass<'directiveLiteral'> {
    private constructor(originalSource: string) {
        super('directiveLiteral', originalSource);
    }

    static create(target: DirectiveLiteral, originalSource: string): DirectiveLiteralTypeClass {
        throw new Error('DirectiveLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const directiveLiteralTypePair: EvaluatePair<DirectiveLiteral, DirectiveLiteralTypeClass> =
    makeEvaluatePair(isDirectiveLiteral, (target, originalSource) =>
        DirectiveLiteralTypeClass.create(target, originalSource),
    );

export const isDirectiveLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is DirectiveLiteralTypeClass => target instanceof DirectiveLiteralTypeClass;
