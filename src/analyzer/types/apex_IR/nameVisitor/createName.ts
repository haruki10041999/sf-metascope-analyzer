import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from '../pairVisitor';

export type CreatedNameType = {
    type: 'createdName';
    name: PairType[];
};

export const makeCreatedNameType = (ctx: CreatedNameContext): CreatedNameType => {
    if (!ctx.idCreatedNamePair_list()) {
        throw new Error('値が異常です。CreatedNameContext: ' + ctx.getText());
    }

    return {
        type: 'createdName',
        name: ctx.idCreatedNamePair_list().map((pair) => new PairVisitor().visit(pair)),
    };
};
