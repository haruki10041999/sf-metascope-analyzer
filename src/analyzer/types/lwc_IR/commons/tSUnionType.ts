import { isTSUnionType, type TSUnionType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSUnionTypeTypeClass extends LwcCommonTypeClass<'tSUnionType'> {
    private constructor(originalSource: string) {
        super('tSUnionType', originalSource);
    }

    static create(target: TSUnionType, originalSource: string): TSUnionTypeTypeClass {
        throw new Error('TSUnionTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSUnionTypeTypePair: EvaluatePair<TSUnionType, TSUnionTypeTypeClass> =
    makeEvaluatePair(isTSUnionType, (target, originalSource) =>
        TSUnionTypeTypeClass.create(target, originalSource),
    );

export const isTSUnionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSUnionTypeTypeClass => target instanceof TSUnionTypeTypeClass;
