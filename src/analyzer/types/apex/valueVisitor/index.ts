import {
    ApexParserBaseVisitor,
    ValueContext,
    ElementValueContext,
    WhenValueContext,
    CoordinateValueContext,
    LocationValueContext,
} from '@apexdevtools/apex-parser';

import { ValueType as valueType, makeValueType } from './value';
import { ElementValueType, makeElementValueType } from './elementValue';
import { WhenValueType, makeWhenValueType } from './whenValue';
import { CoordinateValueType, makeCoordinateValueType } from './coordinateValue';
import { LocationValueType, makeLocationValueType } from './locationValue';

export type ValueType =
    valueType | ElementValueType | WhenValueType | CoordinateValueType | LocationValueType;

export class ValueVisitor extends ApexParserBaseVisitor<ValueType> {
    visitValue(ctx: ValueContext) {
        console.log('解析を開始します。' + 'ValueContext:  ' + ctx.getText());
        const result = makeValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitElementValue(ctx: ElementValueContext) {
        console.log('解析を開始します。' + 'ElementValueContext:  ' + ctx.getText());
        const result = makeElementValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElementValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhenValue(ctx: WhenValueContext) {
        console.log('解析を開始します。' + 'WhenValueContext:  ' + ctx.getText());
        const result = makeWhenValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhenValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitCoordinateValue(ctx: CoordinateValueContext) {
        console.log('解析を開始します。' + 'CoordinateValueContext:  ' + ctx.getText());
        const result = makeCoordinateValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CoordinateValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLocationValue(ctx: LocationValueContext) {
        console.log('解析を開始します。' + 'LocationValueContext:  ' + ctx.getText());
        const result = makeLocationValueType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LocationValueContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
