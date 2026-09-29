import {
    ApexParserBaseVisitor,
    NoRestContext,
    ClassCreatorRestContext,
    ArrayCreatorRestContext,
    MapCreatorRestContext,
    SetCreatorRestContext,
    CreatorContext,
} from '@apexdevtools/apex-parser';

import { NoRestType, makeNoRestType } from './noRest';
import { ClassCreatorRestType, makeClassCreatorRestType } from './classCreatorRest';
import { ArrayCreatorRestType, makeArrayCreatorRestType } from './arrayCreatorRest';
import { MapCreatorRestType, makeMapCreatorRestType } from './mapCreatorRest';
import { SetCreatorRestType, makeSetCreatorRestType } from './SetCreatorRest';
import { CreatorType, makeCreatorType } from './creator';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type RestType =
    | NoRestType
    | ClassCreatorRestType
    | ArrayCreatorRestType
    | MapCreatorRestType
    | SetCreatorRestType
    | CreatorType
    | ErrorType;

export class RestVisitor extends CommonVisitor<RestType> {
    visitNoRest(ctx: NoRestContext) {
        console.log('解析を開始します。' + 'NoRestContext:  ' + ctx.getText());
        const result = makeNoRestType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'NoRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitClassCreatorRest(ctx: ClassCreatorRestContext) {
        console.log('解析を開始します。' + 'ClassCreatorRestContext:  ' + ctx.getText());
        const result = makeClassCreatorRestType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ClassCreatorRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitArrayCreatorRest(ctx: ArrayCreatorRestContext) {
        console.log('解析を開始します。' + 'ArrayCreatorRestContext:  ' + ctx.getText());
        const result = makeArrayCreatorRestType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ArrayCreatorRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitMapCreatorRest(ctx: MapCreatorRestContext) {
        console.log('解析を開始します。' + 'MapCreatorRestContext:  ' + ctx.getText());
        const result = makeMapCreatorRestType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MapCreatorRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSetCreatorRest(ctx: SetCreatorRestContext) {
        console.log('解析を開始します。' + 'SetCreatorRestContext:  ' + ctx.getText());
        const result = makeSetCreatorRestType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SetCreatorRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitCreator(ctx: CreatorContext) {
        console.log('解析を開始します。' + 'SetCreatorRestContext:  ' + ctx.getText());
        const result = makeCreatorType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SetCreatorRestContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

