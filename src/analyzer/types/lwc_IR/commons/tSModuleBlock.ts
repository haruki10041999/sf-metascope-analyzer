import { isTSModuleBlock, type TSModuleBlock } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSModuleBlockTypeClass extends LwcCommonTypeClass<'tSModuleBlock'> {
    private constructor(originalSource: string) {
        super('tSModuleBlock', originalSource);
    }

    static create(target: TSModuleBlock, originalSource: string): TSModuleBlockTypeClass {
        throw new Error('TSModuleBlockTypeClass.create is not implemented: ' + target.type);
    }
}

export const tSModuleBlockTypePair: EvaluatePair<TSModuleBlock, TSModuleBlockTypeClass> =
    makeEvaluatePair(isTSModuleBlock, (target, originalSource) =>
        TSModuleBlockTypeClass.create(target, originalSource),
    );

export const isTSModuleBlockType = (
    target: LwcCommonTypeClass<string>,
): target is TSModuleBlockTypeClass => target instanceof TSModuleBlockTypeClass;
