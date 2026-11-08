import { BlockContext } from '@apexdevtools/apex-parser';

import {
    NormalStatementTypeClass,
    StatementVisitor,
    isNormalStatementType,
} from '../statementVisitor';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type BlockType = TypeField<'block'> & {
    block: NormalStatementTypeClass[];
};

export class BlockTypeClass extends ApexCommonTypeClass<'block', BlockType> {
    private constructor(block: NormalStatementTypeClass[], sourceSpan: SourceSpan) {
        super('block', { block: block }, sourceSpan);
    }

    static create(ctx: BlockContext): BlockTypeClass {
        return new BlockTypeClass(
            ctx.statement_list().map((s) => {
                return NormalStatementTypeClass.create(s);
            }),
            getSourceSpan(ctx),
        );
    }
}

export const isNormalBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BlockTypeClass => {
    return isSpicifyApexCommonTypeClass('block', target);
};
