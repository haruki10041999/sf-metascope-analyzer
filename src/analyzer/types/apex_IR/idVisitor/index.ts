import { IdContext, AnyIdContext, SoqlIdContext, SoslIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass } from './normal';
import { AnyIdTypeClass } from './anyId';
import { SoqlIdTypeClass } from './soqlId';
import { SoslIdTypeClass } from './soslId';

import { CommonTypeClass, ContextTypeClass, ErrorTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalIdType, NormalIdTypeClass } from './normal';
export { isAnyIdType, AnyIdTypeClass } from './anyId';
export { isSoqlIdType, SoqlIdTypeClass } from './soqlId';
export { isSoslIdType, SoslIdTypeClass } from './soslId';

export class IdTypeClass extends ContextTypeClass {
    constructor(type: string, value: any | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isIdTypeAll = (target: CommonTypeClass): target is IdTypeClass => {
    return target instanceof IdTypeClass;
};

export class IdVisitor extends CommonVisitor<IdTypeClass> {
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
