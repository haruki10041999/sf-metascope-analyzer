import { IdContext, AnyIdContext, SoqlIdContext, SoslIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass } from './normal';
import { AnyIdTypeClass } from './anyId';
import { SoqlIdTypeClass } from './soqlId';
import { SoslIdTypeClass } from './soslId';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalIdType, NormalIdTypeClass } from './normal';
export { isAnyIdType, AnyIdTypeClass } from './anyId';
export { isSoqlIdType, SoqlIdTypeClass } from './soqlId';
export { isSoslIdType, SoslIdTypeClass } from './soslId';

export class IdValueTypeClass<T> extends CommonTypeClass {
    private value: T;

    constructor(type: string, value: T) {
        super(type);
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class IdTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class IdListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type IdAllTypeClass =
    IdValueTypeClass<unknown> | IdTypeClass<unknown> | IdListTypeClass<unknown>;

export const isIdTypeAll = (target: CommonTypeClass): target is IdAllTypeClass => {
    return (
        target instanceof IdValueTypeClass ||
        target instanceof IdTypeClass ||
        target instanceof IdListTypeClass
    );
};

export class IdVisitor extends CommonVisitor<IdAllTypeClass> {
    visitId(ctx: IdContext) {
        return NormalIdTypeClass.create(ctx);
    }
    visitAnyId(ctx: AnyIdContext) {
        return AnyIdTypeClass.create(ctx);
    }
    visitSoqlId(ctx: SoqlIdContext) {
        return SoqlIdTypeClass.create(ctx);
    }

    visitSoslId(ctx: SoslIdContext) {
        return SoslIdTypeClass.create(ctx);
    }
}
