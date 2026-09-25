import {
    ApexParserBaseVisitor,
    ElementValuePairContext,
    IdCreatedNamePairContext,
    MapCreatorRestPairContext,
} from '@apexdevtools/apex-parser';

import { ElementValuePairType, makeElementValuePairType } from './elementValuePair';
import { IdCreatedNamePairType, makeIdCreatedNamePairType } from './idCreatedNamePair';
import { MapCreatorPairType, makeMapCreatorPairType } from './mapCreatorPair';

export type PairType = IdCreatedNamePairType | ElementValuePairType | MapCreatorPairType;

export class PairVisitor extends ApexParserBaseVisitor<PairType> {
    visitIdCreatedNamePairContext(ctx: IdCreatedNamePairContext): PairType {
        return makeIdCreatedNamePairType(ctx);
    }

    visitElementValuePairContext(ctx: ElementValuePairContext): PairType {
        return makeElementValuePairType(ctx);
    }

    visitMapCreatorRestPairContext(ctx: MapCreatorRestPairContext): PairType {
        return makeMapCreatorPairType(ctx);
    }
}
