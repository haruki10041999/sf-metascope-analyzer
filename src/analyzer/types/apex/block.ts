import { NormalBlock } from './converter';

import { makeStatementType } from './statement';

export const makeNormalBlockType = (block: NormalBlock): any => {
    if (block) {
        const statements: any[] = [];

        block.forEach((statement) => {
            statements.push(makeStatementType(statement));
        });

        return statements;
    }

    return undefined;
};
