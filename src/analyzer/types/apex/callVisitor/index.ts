import {
    ApexParserBaseVisitor,
    MethodCallContext,
    DotMethodCallContext,
} from '@apexdevtools/apex-parser';

import { MethodCallType, makeMethodCallType } from './methodCall';
import { DotMethodCallType, makeDotMethodCallType } from './dotMethodCall';

export type CallType = MethodCallType | DotMethodCallType;

export class CallVisitor extends ApexParserBaseVisitor<CallType> {
    visitMethodCall(ctx: MethodCallContext) {
        console.log('解析を開始します。' + 'MethodCallContext:  ' + ctx.getText());
        const result = makeMethodCallType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'MethodCallContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDotMethodCall(ctx: DotMethodCallContext) {
        console.log('解析を開始します。' + 'DotMethodCallContext:  ' + ctx.getText());
        const result = makeDotMethodCallType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DotMethodCallContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
