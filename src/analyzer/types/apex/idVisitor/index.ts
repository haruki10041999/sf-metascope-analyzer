import {
    ApexParserBaseVisitor,
    IdContext,
    AnyIdContext,
    SoqlIdContext,
    SoslIdContext,
} from '@apexdevtools/apex-parser';

import { IdType as idType, makeIdType } from './id';
import { AnyIdType, makeAnyIdType } from './anyId';
import { SoqlIdType, makeSoqlIdType } from './soqlId';
import { SoslIdType, makeSoslIdType } from './soslId';

export type IdType = idType | AnyIdType | SoqlIdType | SoslIdType;

export class IdVisitor extends ApexParserBaseVisitor<IdType> {
    visitId(ctx: IdContext) {
        return makeIdType(ctx);
    }
    visitAnyId(ctx: AnyIdContext) {
        return makeAnyIdType(ctx);
    }
    visitSoqlId(ctx: SoqlIdContext) {
        return makeSoqlIdType(ctx);
    }

    visitSoslId(ctx: SoslIdContext) {
        return makeSoslIdType(ctx);
    }
}
