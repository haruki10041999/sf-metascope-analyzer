import { isNullLiteral, type NullLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class NullLiteralTypeClass extends LwcCommonTypeClass<'nullLiteral'> {
    private constructor() {
        super('nullLiteral');
    }

    static create(_target: NullLiteral, _originalSource: string): NullLiteralTypeClass {
        return new NullLiteralTypeClass();
    }
}

export const nullLiteralTypePair: EvaluatePair<NullLiteral, NullLiteralTypeClass> =
    makeEvaluatePair(isNullLiteral, (target, originalSource) =>
        NullLiteralTypeClass.create(target, originalSource),
    );

export const isNullLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NullLiteralTypeClass => target instanceof NullLiteralTypeClass;
