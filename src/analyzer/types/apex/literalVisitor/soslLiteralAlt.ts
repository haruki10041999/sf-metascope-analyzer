import { SoslLiteralAltContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SoslLiteralAltType = {
    type: 'soslLiteralAlt';
    find: string;
    soslClauses: Omit<ClauseType, 'type'>;
};

export const makeSoslLiteralAltType = (ctx: SoslLiteralAltContext): SoslLiteralAltType => {
    const { type, ...soslClauses } = new ClauseVisitor().visit(ctx.soslClauses());

    return {
        type: 'soslLiteralAlt',
        find: ctx.FindLiteralAlt().getText(),
        soslClauses: soslClauses,
    };
};
