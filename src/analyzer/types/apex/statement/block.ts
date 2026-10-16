import typia from 'typia';

import { NormalStatementClass } from '..converter';

import { StatementType, makeStatementType } from './statement';

type BlockBlock = {
    index: number;
} & StatementType;

export type BlockType = {
    kind: 'block';
    block: BlockBlock[];
};

export const makeBlockType = (NormalStatementClass: NormalStatementClass[]): BlockType => ({
    const blockBlocks: BlockBlock[] = NormalStatementClass.map((stmt, index) => ({
        index,
        ...makeStatementType(stmt),
    }));


    
});
