import {
    ApexParserBaseVisitor,
    CatchClauseContext,
    AllRowsClauseContext,
    OffsetClauseContext,
    LimitClauseContext,
    ForClausesContext,
    ElseClauseContext,
} from '@apexdevtools/apex-parser';

import { CatchClauseType, makeCatchClauseType } from './catchClause';
import { AllRowClauseType, makeAllRowClauseType } from './allRowClause';
import { OffsetClauseType, makeOffsetClauseType } from './offsetClause';
import { LimitClauseType, makeLimitClauseType } from './limitClause';
import { ForClauseType, makeForClauseType } from './forClause';
import { ElseClauseType, makeElseClauseType } from './elseClause';

export type ClauseType =
    | CatchClauseType
    | AllRowClauseType
    | OffsetClauseType
    | LimitClauseType
    | ForClauseType
    | ElseClauseType;

export class ClauseVisitor extends ApexParserBaseVisitor<ClauseType> {
    visitCatchClauseContext(ctx: CatchClauseContext) {
        return makeCatchClauseType(ctx);
    }

    visitAllRowsClauseContext(ctx: AllRowsClauseContext) {
        return makeAllRowClauseType(ctx);
    }

    visitOffsetClauseContext(ctx: OffsetClauseContext) {
        return makeOffsetClauseType(ctx);
    }

    visitLimitClauseContext(ctx: LimitClauseContext) {
        return makeLimitClauseType(ctx);
    }

    visitForClausesContext(ctx: ForClausesContext) {
        return makeForClauseType(ctx);
    }

    visitElseClauseContext(ctx: ElseClauseContext) {
        return makeElseClauseType(ctx);
    }
}
