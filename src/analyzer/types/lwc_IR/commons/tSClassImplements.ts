import { isTSClassImplements, type TSClassImplements } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSClassImplementsTypeClass extends LwcCommonTypeClass<'tSClassImplements'> {
    private constructor(originalSource: string) {
        super('tSClassImplements', originalSource);
    }

    static create(target: TSClassImplements, originalSource: string): TSClassImplementsTypeClass {
        throw new Error('TSClassImplementsTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSClassImplementsTypePair: EvaluatePair<
    TSClassImplements,
    TSClassImplementsTypeClass
> = makeEvaluatePair(isTSClassImplements, (target, originalSource) =>
    TSClassImplementsTypeClass.create(target, originalSource),
);

export const isTSClassImplementsType = (
    target: LwcCommonTypeClass<string>,
): target is TSClassImplementsTypeClass => target instanceof TSClassImplementsTypeClass;
