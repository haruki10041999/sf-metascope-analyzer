import { isTSTypeLiteral, type TSTypeLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSTypeLiteralTypeClass extends LwcCommonTypeClass<'tSTypeLiteral'> {
    private constructor(originalSource: string) {
        super('tSTypeLiteral', originalSource);
    }

    static create(target: TSTypeLiteral, originalSource: string): TSTypeLiteralTypeClass {
        throw new Error('TSTypeLiteralTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSTypeLiteralTypePair: EvaluatePair<TSTypeLiteral, TSTypeLiteralTypeClass> =
    makeEvaluatePair(isTSTypeLiteral, (target, originalSource) =>
        TSTypeLiteralTypeClass.create(target, originalSource),
    );

export const isTSTypeLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeLiteralTypeClass => target instanceof TSTypeLiteralTypeClass;
