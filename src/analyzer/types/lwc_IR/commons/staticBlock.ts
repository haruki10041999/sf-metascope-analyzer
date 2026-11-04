import { isStaticBlock, type StaticBlock } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class StaticBlockTypeClass extends LwcCommonTypeClass<'staticBlock'> {
    private constructor(originalSource: string) {
        super('staticBlock', originalSource);
    }

    static create(target: StaticBlock, originalSource: string): StaticBlockTypeClass {
        throw new Error('StaticBlockTypeClass.create is not implemented: ' + target.type);
    }
}

export const staticBlockTypePair: EvaluatePair<StaticBlock, StaticBlockTypeClass> =
    makeEvaluatePair(isStaticBlock, (target, originalSource) =>
        StaticBlockTypeClass.create(target, originalSource),
    );

export const isStaticBlockType = (
    target: LwcCommonTypeClass<string>,
): target is StaticBlockTypeClass => target instanceof StaticBlockTypeClass;
