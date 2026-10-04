import { IdContext, AnyIdContext, SoqlIdContext, SoslIdContext } from '@apexdevtools/apex-parser';

import { NormalIdTypeClass } from './normal';
import { AnyIdTypeClass } from './anyId';
import { SoqlIdTypeClass } from './soqlId';
import { SoslIdTypeClass } from './soslId';

import {
    ContextTypeClass,
    ContextListTypeClass,
    ErrorTypeClass,
    CommonTypeClass,
    CommonVisitor,
} from '../commonVisitor';

export { isNormalIdType, NormalIdTypeClass } from './normal';
export { isAnyIdType, AnyIdTypeClass } from './anyId';
export { isSoqlIdType, SoqlIdTypeClass } from './soqlId';
export { isSoslIdType, SoslIdTypeClass } from './soslId';

export class IdTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type, value);
    }
}

export class IdListTypeClass<T> extends ContextListTypeClass<T> {
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type, value);
    }
}

export const isIdTypeAll = (
    target: CommonTypeClass,
): target is IdTypeClass<unknown> | IdListTypeClass<unknown> => {
    return target instanceof IdTypeClass || target instanceof IdListTypeClass;
};

export class IdVisitor extends CommonVisitor<IdTypeClass<unknown> | IdListTypeClass<unknown>> {
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
