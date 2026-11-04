import { isNullLiteral, type NullLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NullLiteralTypeClass extends LwcCommonTypeClass<'nullLiteral'> {
    private constructor(originalSource: string) {
        super('nullLiteral', originalSource);
    }

    static create(target: NullLiteral, originalSource: string): NullLiteralTypeClass {
        throw new Error('NullLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const nullLiteralTypePair: EvaluatePair<NullLiteral, NullLiteralTypeClass> =
    makeEvaluatePair(isNullLiteral, (target, originalSource) =>
        NullLiteralTypeClass.create(target, originalSource),
    );

export const isNullLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NullLiteralTypeClass => target instanceof NullLiteralTypeClass;
