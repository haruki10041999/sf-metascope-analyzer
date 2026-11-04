import { isTSRestType, type TSRestType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSRestTypeTypeClass extends LwcCommonTypeClass<'tSRestType'> {
    private constructor(originalSource: string) {
        super('tSRestType', originalSource);
    }

    static create(target: TSRestType, originalSource: string): TSRestTypeTypeClass {
        throw new Error('TSRestTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSRestTypeTypePair: EvaluatePair<TSRestType, TSRestTypeTypeClass> = makeEvaluatePair(
    isTSRestType,
    (target, originalSource) => TSRestTypeTypeClass.create(target, originalSource),
);

export const isTSRestTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSRestTypeTypeClass => target instanceof TSRestTypeTypeClass;
