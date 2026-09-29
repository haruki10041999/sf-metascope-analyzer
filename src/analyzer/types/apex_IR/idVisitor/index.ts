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

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type IdType = idType | AnyIdType | SoqlIdType | SoslIdType | ErrorType;

export class IdVisitor extends CommonVisitor<IdType> {
    visitId(ctx: IdContext) {
        console.log('解析を開始します。' + 'IdContext:  ' + ctx.getText());
        const result = makeIdType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'IdContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
    visitAnyId(ctx: AnyIdContext) {
        console.log('解析を開始します。' + 'AnyIdContext:  ' + ctx.getText());
        const result = makeAnyIdType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnyIdContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
    visitSoqlId(ctx: SoqlIdContext) {
        console.log('解析を開始します。' + 'SoqlIdContext:  ' + ctx.getText());
        const result = makeSoqlIdType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoqlIdContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoslId(ctx: SoslIdContext) {
        console.log('解析を開始します。' + 'SoslIdContext:  ' + ctx.getText());
        const result = makeSoslIdType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslIdContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
