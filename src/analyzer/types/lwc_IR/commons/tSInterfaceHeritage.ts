import { isTSInterfaceHeritage, type TSInterfaceHeritage } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSInterfaceHeritageTypeClass extends LwcCommonTypeClass<'tSInterfaceHeritage'> {
    private constructor(originalSource: string) {
        super('tSInterfaceHeritage', originalSource);
    }

    static create(
        target: TSInterfaceHeritage,
        originalSource: string,
    ): TSInterfaceHeritageTypeClass {
        throw new Error('TSInterfaceHeritageTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSInterfaceHeritageTypePair: EvaluatePair<
    TSInterfaceHeritage,
    TSInterfaceHeritageTypeClass
> = makeEvaluatePair(isTSInterfaceHeritage, (target, originalSource) =>
    TSInterfaceHeritageTypeClass.create(target, originalSource),
);

export const isTSInterfaceHeritageType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceHeritageTypeClass => target instanceof TSInterfaceHeritageTypeClass;
