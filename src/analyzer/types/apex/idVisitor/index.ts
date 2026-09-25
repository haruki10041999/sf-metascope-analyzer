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
    visitIdContext(ctx: IdContext) {
        return makeIdType(ctx);
    }
    visitAnyIdContext(ctx: AnyIdContext) {
        return makeAnyIdType(ctx);
    }
    visitSoqlIdContext(ctx: SoqlIdContext) {
        return makeSoqlIdType(ctx);
    }

    visitSoslIdContext(ctx: SoslIdContext) {
        return makeSoslIdType(ctx);
    }
}
