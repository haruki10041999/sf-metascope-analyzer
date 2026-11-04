import { isBlockStatement, type BlockStatement } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class BlockStatementTypeClass extends LwcCommonTypeClass<'blockStatement'> {
    private constructor(originalSource: string) {
        super('blockStatement', originalSource);
    }

    static create(target: BlockStatement, originalSource: string): BlockStatementTypeClass {
        throw new Error('BlockStatementTypeClass.create is not implemented: ' + target.type);
    }
}

export const blockStatementTypePair: EvaluatePair<BlockStatement, BlockStatementTypeClass> =
    makeEvaluatePair(isBlockStatement, (target, originalSource) =>
        BlockStatementTypeClass.create(target, originalSource),
    );

export const isBlockStatementType = (
    target: LwcCommonTypeClass<string>,
): target is BlockStatementTypeClass => target instanceof BlockStatementTypeClass;
