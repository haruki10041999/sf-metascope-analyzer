import { isBigIntLiteral, type BigIntLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BigIntLiteralTypeClass extends LwcCommonTypeClass<'bigIntLiteral'> {
    private constructor(originalSource: string) {
        super('bigIntLiteral', originalSource);
    }

    static create(target: BigIntLiteral, originalSource: string): BigIntLiteralTypeClass {
        throw new Error('BigIntLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const bigIntLiteralTypePair: EvaluatePair<BigIntLiteral, BigIntLiteralTypeClass> =
    makeEvaluatePair(isBigIntLiteral, (target, originalSource) =>
        BigIntLiteralTypeClass.create(target, originalSource),
    );

export const isBigIntLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is BigIntLiteralTypeClass => target instanceof BigIntLiteralTypeClass;
