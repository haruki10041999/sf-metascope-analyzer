import { LwcCommonTypeClass, LwcCommonVisitor, lazyPairs } from '../commonVisitor';
import { BlockStatementTypeClass, blockStatementTypePair } from '../commons/blockStatement';
import { ProgramTypeClass, programTypePair } from '../commons/program';
import { TSModuleBlockTypeClass, tSModuleBlockTypePair } from '../commons/tSModuleBlock';

export {
    BlockStatementTypeClass,
    blockStatementTypePair,
    isBlockStatementType,
} from '../commons/blockStatement';
export { ProgramTypeClass, programTypePair, isProgramType } from '../commons/program';
export {
    TSModuleBlockTypeClass,
    tSModuleBlockTypePair,
    isTSModuleBlockType,
} from '../commons/tSModuleBlock';

export const blockVisitorEvaluatePairs = lazyPairs(
    () => [blockStatementTypePair, programTypePair, tSModuleBlockTypePair] as const,
);

export class BlockVisitor extends LwcCommonVisitor<
    ReturnType<typeof blockVisitorEvaluatePairs>[number]
> {
    get evaluatePair() {
        return blockVisitorEvaluatePairs();
    }
}

export type BlockTypeClass = BlockStatementTypeClass | ProgramTypeClass | TSModuleBlockTypeClass;

export const isBlockType = (target: LwcCommonTypeClass<string>): target is BlockTypeClass => {
    return (
        target instanceof BlockStatementTypeClass ||
        target instanceof ProgramTypeClass ||
        target instanceof TSModuleBlockTypeClass
    );
};
