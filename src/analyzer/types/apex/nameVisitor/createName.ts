import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from '../pairVisitor';

export type CreatedNameType = {
    type: 'createdName';
    name: Omit<PairType, 'type'>[];
};

export const makeCreatedNameType = (ctx: CreatedNameContext): CreatedNameType => {
    return {
        type: 'createdName',
        name: ctx.idCreatedNamePair_list().map((pair) => new PairVisitor().visit(pair)),
    };
};
