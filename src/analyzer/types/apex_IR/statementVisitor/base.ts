import type { AccessLevelTypeClass } from './accessLevel';
import { ApexErrorTypeClass, ApexCommonTypeClass } from '../commonVisitor';

export class StatementValueTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T;
    constructor(type: TName, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class StatementTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: T | ApexErrorTypeClass;
    constructor(type: TName, value: T | ApexErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ApexErrorTypeClass {
        return this.value;
    }
}

export class StatementListTypeClass<TName extends string, T> extends ApexCommonTypeClass<TName> {
    private value: (T | ApexErrorTypeClass)[];
    constructor(type: TName, value: (T | ApexErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ApexErrorTypeClass)[] {
        return this.value;
    }
}

export class DmlStatementTypeClass<TName extends string, T> extends StatementTypeClass<TName, T> {
    private accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null = null;
    constructor(
        type: TName,
        value: T | ApexErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ApexErrorTypeClass | null,
    ) {
        super(type, value);
        this.accessLevel = accessLevel;
    }

    getAccessLevel(): AccessLevelTypeClass | ApexErrorTypeClass | null {
        return this.accessLevel;
    }
}

export type StatementAllTypeClass =
    | StatementValueTypeClass<string, unknown>
    | StatementTypeClass<string, unknown>
    | StatementListTypeClass<string, unknown>;

export const isStatementTypeAll = (
    target: ApexCommonTypeClass<string>,
): target is StatementAllTypeClass => {
    return (
        target instanceof StatementValueTypeClass ||
        target instanceof StatementTypeClass ||
        target instanceof StatementListTypeClass
    );
};
