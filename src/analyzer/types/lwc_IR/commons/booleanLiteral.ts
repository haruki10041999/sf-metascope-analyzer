import { isBooleanLiteral, type BooleanLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BooleanLiteralTypeClass extends LwcCommonTypeClass<'booleanLiteral'> {
    private constructor(originalSource: string) {
        super('booleanLiteral', originalSource);
    }

    static create(target: BooleanLiteral, originalSource: string): BooleanLiteralTypeClass {
        throw new Error('BooleanLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const booleanLiteralTypePair: EvaluatePair<BooleanLiteral, BooleanLiteralTypeClass> =
    makeEvaluatePair(isBooleanLiteral, (target, originalSource) =>
        BooleanLiteralTypeClass.create(target, originalSource),
    );

export const isBooleanLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is BooleanLiteralTypeClass => target instanceof BooleanLiteralTypeClass;
