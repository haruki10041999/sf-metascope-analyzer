import { isTSOptionalType, type TSOptionalType } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSOptionalTypeTypeClass extends LwcCommonTypeClass<'tSOptionalType'> {
    private constructor(originalSource: string) {
        super('tSOptionalType', originalSource);
    }

    static create(target: TSOptionalType, originalSource: string): TSOptionalTypeTypeClass {
        throw new Error('TSOptionalTypeTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSOptionalTypeTypePair: EvaluatePair<TSOptionalType, TSOptionalTypeTypeClass> =
    makeEvaluatePair(isTSOptionalType, (target, originalSource) =>
        TSOptionalTypeTypeClass.create(target, originalSource),
    );

export const isTSOptionalTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSOptionalTypeTypeClass => target instanceof TSOptionalTypeTypeClass;
