import { ApexParserBaseVisitor, CatchClauseContext } from '@apexdevtools/apex-parser';

import { CatchClauseType, makeCatchClauseType } from './catchClause';

export type ClauseType = CatchClauseType;

export class ClauseVisitor extends ApexParserBaseVisitor<ClauseType> {
    visitCatchClauseContext(ctx: CatchClauseContext): CatchClauseType {
        return makeCatchClauseType(ctx);
    }
}
