import { SoslLiteralAltContext } from '@apexdevtools/apex-parser';

import { ClauseType, ClauseVisitor } from '../clauseVisitor';

export type SoslLiteralAltType = {
    type: 'soslLiteralAlt';
    literal: {
        find: string;
        soslClauses: ClauseType;
    };
};

export const makeSoslLiteralAltType = (ctx: SoslLiteralAltContext): SoslLiteralAltType => {
    const soslClauses = new ClauseVisitor().visit(ctx.soslClauses());

    return {
        type: 'soslLiteralAlt',
        literal: {
            find: ctx.FindLiteralAlt().getText(),
            soslClauses: soslClauses,
        },
    };
};

