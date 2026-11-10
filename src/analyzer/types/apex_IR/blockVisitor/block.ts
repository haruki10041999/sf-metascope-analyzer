import { BlockContext } from '@apexdevtools/apex-parser';

import { StatementTypeClass } from '../statementVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type BlockType = TypeField<'block'> & {
    block: StatementTypeClass[];
};

export class BlockTypeClass extends ApexCommonTypeClass<'block', BlockType> {
    private constructor(fields: FieldsOf<BlockType>, sourceSpan: SourceSpan) {
        super('block', fields, sourceSpan);
    }

    static create(ctx: BlockContext): BlockTypeClass {
        return new BlockTypeClass(
            {
                block: createNodeList(
                    ctx.statement_list(),
                    (c) => StatementTypeClass.create(c),
                    'statement',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getBlock(): BlockType['block'] {
        return this.getFields().block;
    }
}

export const isBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is BlockTypeClass => {
    return isSpicifyApexCommonTypeClass('block', target);
};
