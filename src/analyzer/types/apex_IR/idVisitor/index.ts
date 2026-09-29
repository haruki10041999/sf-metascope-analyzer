import { IdContext, AnyIdContext, SoqlIdContext, SoslIdContext } from '@apexdevtools/apex-parser';

import { IdTypeClass as idTypeClass, isIdType } from './id';
import { AnyIdTypeClass } from './anyId';
import { SoqlIdTypeClass } from './soqlId';
import { SoslIdTypeClass } from './soslId';

import { CommonTypeClass, ContextTypeClass, ErrorTypeClass, CommonVisitor } from '../commonVisitor';

export { isIdType } from './id';
export { isAnyIdType } from './anyId';
export { isSoqlIdType } from './soqlId';
export { isSoslIdType } from './soslId';

export class IdTypeClass extends ContextTypeClass {
    private id: any | null = null;

    constructor(type: string, id: any | null, errorClasses: ErrorTypeClass[]) {
        super(type, errorClasses);
        this.id = id;
    }

    getId(): any | null {
        return this.id;
    }
}

export const isIdTypeAll = (target: CommonTypeClass): target is IdTypeClass => {
    return target instanceof IdTypeClass;
};

export class IdVisitor extends CommonVisitor<IdTypeClass> {
    visitId(ctx: IdContext) {
        return idTypeClass.create(ctx);
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
