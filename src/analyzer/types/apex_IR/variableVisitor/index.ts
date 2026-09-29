import {
    ApexParserBaseVisitor,
    ArrayInitializerContext,
    VariableDeclaratorContext,
    VariableDeclaratorsContext,
} from '@apexdevtools/apex-parser';

import { ArrayInitializerType, makeArrayInitializerType } from './arrayInitializer';
import { VariableDeclaratorType, makeVariableDeclaratorType } from './variableDeclarator';
import { VariableDeclaratorsType, makeVariableDeclaratorsType } from './variableDeclarators';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type VariableType =
    ArrayInitializerType | VariableDeclaratorType | VariableDeclaratorsType | ErrorType;

export class VariableVisitor extends CommonVisitor<VariableType> {
    visitArrayInitializer(ctx: ArrayInitializerContext) {
        console.log('解析を開始します。' + 'ArrayInitializerContext:  ' + ctx.getText());
        const result = makeArrayInitializerType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ArrayInitializerContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitVariableDeclarator(ctx: VariableDeclaratorContext) {
        console.log('解析を開始します。' + 'VariableDeclaratorContext:  ' + ctx.getText());
        const result = makeVariableDeclaratorType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'VariableDeclaratorContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitVariableDeclarators(ctx: VariableDeclaratorsContext) {
        console.log('解析を開始します。' + 'VariableDeclaratorsContext:  ' + ctx.getText());
        const result = makeVariableDeclaratorsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'VariableDeclaratorsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
