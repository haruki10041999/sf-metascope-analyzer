import { isTSConstructorType, type TSConstructorType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSConstructorTypeTypeClass extends LwcCommonTypeClass<'tSConstructorType'> {
    private constructor(originalSource: string) {
        super('tSConstructorType', originalSource);
    }

    static create(target: TSConstructorType, originalSource: string): TSConstructorTypeTypeClass {
        throw new Error('TSConstructorTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSConstructorTypeTypePair: EvaluatePair<
    TSConstructorType,
    TSConstructorTypeTypeClass
> = makeEvaluatePair(isTSConstructorType, (target, originalSource) =>
    TSConstructorTypeTypeClass.create(target, originalSource),
);

export const isTSConstructorTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSConstructorTypeTypeClass => target instanceof TSConstructorTypeTypeClass;
