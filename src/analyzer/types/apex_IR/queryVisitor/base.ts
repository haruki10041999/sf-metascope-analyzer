import type { FromNameListTypeClass, UpdateListTypeClass } from '../listVisitor';
import type {
    ForClausesTypeClass,
    WhereClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
} from '../clauseVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class QueryValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class QueryTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class SoqlQueryTypeClass<TName extends string, T> extends QueryTypeClass<TName, T> {
    private from: FromNameListTypeClass | ApexErrorTypeClass;
    private forClause: ForClausesTypeClass | ApexErrorTypeClass | null = null;
    private whereClause: WhereClauseTypeClass | ApexErrorTypeClass | null = null;
    private orderByClause: OrderByClauseTypeClass | ApexErrorTypeClass | null = null;
    private limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null = null;
    private updateList: UpdateListTypeClass | ApexErrorTypeClass | null = null;

    constructor(
        type: TName,
        value: T | ApexErrorTypeClass,
        from: FromNameListTypeClass | ApexErrorTypeClass,
        forClause: ForClausesTypeClass | ApexErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ApexErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ApexErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ApexErrorTypeClass | null,
        updateList: UpdateListTypeClass | ApexErrorTypeClass | null,
    ) {
        super(type, value);
        this.from = from;
        this.forClause = forClause;
        this.whereClause = whereClause;
        this.orderByClause = orderByClause;
        this.limitClause = limitClause;
        this.updateList = updateList;
    }

    getFrom(): FromNameListTypeClass | ApexErrorTypeClass {
        return this.from;
    }

    getForClause(): ForClausesTypeClass | ApexErrorTypeClass | null {
        return this.forClause;
    }

    getWhereClause(): WhereClauseTypeClass | ApexErrorTypeClass | null {
        return this.whereClause;
    }

    getOrderByClause(): OrderByClauseTypeClass | ApexErrorTypeClass | null {
        return this.orderByClause;
    }

    getLimitClause(): LimitClauseTypeClass | ApexErrorTypeClass | null {
        return this.limitClause;
    }

    getUpdateList(): UpdateListTypeClass | ApexErrorTypeClass | null {
        return this.updateList;
    }
}

export type QueryAllTypeClass =
    | QueryValueTypeClass<string, unknown>
    | QueryTypeClass<string, unknown>
    | SoqlQueryTypeClass<string, unknown>;

export const isQueryTypeAll = (target: ApexCommonTypeClass<string>): target is QueryAllTypeClass => {
    return (
        target instanceof QueryValueTypeClass ||
        target instanceof QueryTypeClass ||
        target instanceof SoqlQueryTypeClass
    );
};
