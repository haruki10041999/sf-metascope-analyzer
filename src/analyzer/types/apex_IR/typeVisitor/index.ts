import {
    ApexParserBaseVisitor,
    ArraySubscriptsContext,
    TypeRefContext,
} from '@apexdevtools/apex-parser';

import { ArraySubscriptsType, makeArraySubscriptsType } from './arraySubscripts';
import { TypeRefType, makeTypeRefType } from './typeRef';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type TypeType = ArraySubscriptsType | TypeRefType | ErrorType;

export class TypeVisitor extends CommonVisitor<TypeType> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        console.log('解析を開始します。' + 'ArraySubscriptsContext:  ' + ctx.getText());
        const result = makeArraySubscriptsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ArraySubscriptsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeRef(ctx: TypeRefContext) {
        console.log('解析を開始します。' + 'TypeRefContext:  ' + ctx.getText());
        const result = makeTypeRefType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeRefContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
