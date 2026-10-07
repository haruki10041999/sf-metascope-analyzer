import {
    ApexParserBaseVisitor,
    ElementValuePairContext,
    IdCreatedNamePairContext,
    MapCreatorRestPairContext,
    ElementValuePairsContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { PairAllTypeClass } from './base';

import { ElementValuePairTypeClass } from './elementValuePair';
import { IdCreatedNamePairTypeClass } from './idCreatedNamePair';
import { MapCreatorRestPairTypeClass } from './mapCreatorRestPair';
import { ElementValuePairsTypeClass } from './elementValuePairs';

import { CommonVisitor } from '../commonVisitor';

export { isElementValuePairType, ElementValuePairTypeClass } from './elementValuePair';
export { isIdCreatedNamePairType, IdCreatedNamePairTypeClass } from './idCreatedNamePair';
export { isMapCreatorRestPairType, MapCreatorRestPairTypeClass } from './mapCreatorRestPair';
export { isElementValuePairsType, ElementValuePairsTypeClass } from './elementValuePairs';

export class PairVisitor extends CommonVisitor<PairAllTypeClass> {
    visitIdCreatedNamePair(ctx: IdCreatedNamePairContext) {
        return IdCreatedNamePairTypeClass.create(ctx);
    }

    visitElementValuePair(ctx: ElementValuePairContext) {
        return ElementValuePairTypeClass.create(ctx);
    }

    visitMapCreatorRestPair(ctx: MapCreatorRestPairContext) {
        return MapCreatorRestPairTypeClass.create(ctx);
    }

    visitElementValuePairs(ctx: ElementValuePairsContext) {
        return ElementValuePairsTypeClass.create(ctx);
    }
}
