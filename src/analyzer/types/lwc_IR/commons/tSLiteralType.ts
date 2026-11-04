import { isTSLiteralType, type TSLiteralType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSLiteralTypeTypeClass extends LwcCommonTypeClass<'tSLiteralType'> {
    private constructor(originalSource: string) {
        super('tSLiteralType', originalSource);
    }

    static create(target: TSLiteralType, originalSource: string): TSLiteralTypeTypeClass {
        throw new Error('TSLiteralTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSLiteralTypeTypePair: EvaluatePair<TSLiteralType, TSLiteralTypeTypeClass> =
    makeEvaluatePair(isTSLiteralType, (target, originalSource) =>
        TSLiteralTypeTypeClass.create(target, originalSource),
    );

export const isTSLiteralTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSLiteralTypeTypeClass => target instanceof TSLiteralTypeTypeClass;
