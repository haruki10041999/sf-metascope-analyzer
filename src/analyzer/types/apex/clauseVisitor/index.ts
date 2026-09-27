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
        return makeForClausesType(ctx);
    }

    visitElseClauseContext(ctx: ElseClauseContext) {
        return makeElseClauseType(ctx);
    }

    visitGroupByClauseContext(ctx: GroupByClauseContext) {
        return makeGroupByClauseType(ctx);
    }

    visitOrderByClauseContext(ctx: OrderByClauseContext) {
        return makeOrderByClauseType(ctx);
    }

    visitWithClauseContext(ctx: WithClauseContext) {
        return makeWithClauseType(ctx);
    }

    visitWhereClauseContext(ctx: WhereClauseContext) {
        return makeWhereClauseType(ctx);
    }

    visitWhenClauseContext(ctx: WhenClauseContext) {
        return makeWhenClauseType(ctx);
    }

    visitSoslWithClauseContext(ctx: SoslWithClauseContext) {
        return makeSoslWithClauseType(ctx);
    }

    visitSoslClausesContext(ctx: SoslClausesContext) {
        return makeSoslClausesType(ctx);
    }
}
