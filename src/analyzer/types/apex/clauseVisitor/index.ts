import {
    ApexParserBaseVisitor,
    CatchClauseContext,
    AllRowsClauseContext,
    OffsetClauseContext,
    LimitClauseContext,
    ForClausesContext,
    ElseClauseContext,
    GroupByClauseContext,
    OrderByClauseContext,
    WithClauseContext,
    WhereClauseContext,
    WhenClauseContext,
    SoslWithClauseContext,
    SoslClausesContext,
} from '@apexdevtools/apex-parser';

import { CatchClauseType, makeCatchClauseType } from './catchClause';
import { AllRowClauseType, makeAllRowClauseType } from './allRowClause';
import { OffsetClauseType, makeOffsetClauseType } from './offsetClause';
import { LimitClauseType, makeLimitClauseType } from './limitClause';
import { ForClausesType, makeForClausesType } from './forClauses';
import { ElseClauseType, makeElseClauseType } from './elseClause';
import { GroupByClauseType, makeGroupByClauseType } from './GroupByClause';
import { OrderByClauseType, makeOrderByClauseType } from './orderByClause';
import { WithClauseType, makeWithClauseType } from './withClause';
import { WhereClauseType, makeWhereClauseType } from './whereClause';
import { WhenClauseType, makeWhenClauseType } from './whenClause';
import { SoslWithClauseType, makeSoslWithClauseType } from './soslWithClause';
import { SoslClausesType, makeSoslClausesType } from './soslClauses';

export type ClauseType =
    | CatchClauseType
    | AllRowClauseType
    | OffsetClauseType
    | LimitClauseType
    | ForClausesType
    | ElseClauseType
    | GroupByClauseType
    | OrderByClauseType
    | WithClauseType
    | WhereClauseType
    | WhenClauseType
    | SoslWithClauseType
    | SoslClausesType;

export class ClauseVisitor extends ApexParserBaseVisitor<ClauseType> {
    visitCatchClause(ctx: CatchClauseContext) {
        return makeCatchClauseType(ctx);
    }

    visitAllRowsClause(ctx: AllRowsClauseContext) {
        return makeAllRowClauseType(ctx);
    }

    visitOffsetClause(ctx: OffsetClauseContext) {
        return makeOffsetClauseType(ctx);
    }

    visitLimitClause(ctx: LimitClauseContext) {
        return makeLimitClauseType(ctx);
    }

    visitForClauses(ctx: ForClausesContext) {
        return makeForClausesType(ctx);
    }

    visitElseClause(ctx: ElseClauseContext) {
        return makeElseClauseType(ctx);
    }

    visitGroupByClause(ctx: GroupByClauseContext) {
        return makeGroupByClauseType(ctx);
    }

    visitOrderByClause(ctx: OrderByClauseContext) {
        return makeOrderByClauseType(ctx);
    }

    visitWithClause(ctx: WithClauseContext) {
        return makeWithClauseType(ctx);
    }

    visitWhereClause(ctx: WhereClauseContext) {
        return makeWhereClauseType(ctx);
    }

    visitWhenClause(ctx: WhenClauseContext) {
        return makeWhenClauseType(ctx);
    }

    visitSoslWithClause(ctx: SoslWithClauseContext) {
        return makeSoslWithClauseType(ctx);
    }

    visitSoslClauses(ctx: SoslClausesContext) {
        return makeSoslClausesType(ctx);
    }
}
