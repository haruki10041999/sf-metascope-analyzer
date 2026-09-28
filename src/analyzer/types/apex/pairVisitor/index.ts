import {
    ApexParserBaseVisitor,
    ElementValuePairContext,
    IdCreatedNamePairContext,
    MapCreatorRestPairContext,
    ElementValuePairsContext,
} from '@apexdevtools/apex-parser';

import { ElementValuePairType, makeElementValuePairType } from './elementValuePair';
import { IdCreatedNamePairType, makeIdCreatedNamePairType } from './idCreatedNamePair';
import { MapCreatorPairType, makeMapCreatorPairType } from './mapCreatorPair';
import { ElementValuePairsType, makeElementValuePairsType } from './elementValuePairs';

export type PairType =
    IdCreatedNamePairType | ElementValuePairType | MapCreatorPairType | ElementValuePairsType;

export class PairVisitor extends ApexParserBaseVisitor<PairType> {
    visitIdCreatedNamePair(ctx: IdCreatedNamePairContext) {
        console.log('解析を開始します。' + 'IdCreatedNamePairContext:  ' + ctx.getText());
        const result = makeIdCreatedNamePairType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IdCreatedNamePairContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitElementValuePair(ctx: ElementValuePairContext) {
        console.log('解析を開始します。' + 'ElementValuePairContext:  ' + ctx.getText());
        const result = makeElementValuePairType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElementValuePairContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitMapCreatorRestPair(ctx: MapCreatorRestPairContext) {
        console.log('解析を開始します。' + 'MapCreatorRestPairContext:  ' + ctx.getText());
        const result = makeMapCreatorPairType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MapCreatorRestPairContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitElementValuePairs(ctx: ElementValuePairsContext) {
        console.log('解析を開始します。' + 'ElementValuePairsContext:  ' + ctx.getText());
        const result = makeElementValuePairsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElementValuePairsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
