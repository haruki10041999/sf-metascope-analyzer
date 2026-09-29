import {
    ApexParserBaseVisitor,
    ArgumentsContext,
    TypeArgumentsContext,
} from '@apexdevtools/apex-parser';

import { ArgumentsType as argumentsType, makeArgumentsType } from './arguments';
import { TypeArgumentsType, makeTypeArgumentsType } from './typeArguments';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type ArgumentsType = argumentsType | TypeArgumentsType | ErrorType;

export class ArgumentsVisitor extends CommonVisitor<ArgumentsType> {
    visitArguments(ctx: ArgumentsContext): ArgumentsType {
        console.log('解析を開始します。' + 'ArgumentsContext：:  ' + ctx.getText());
        const result = makeArgumentsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ArgumentsContext：:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeArguments(ctx: TypeArgumentsContext): ArgumentsType {
        console.log('解析を開始します。' + 'TypeArgumentsContext:  ' + ctx.getText());
        const result = makeTypeArgumentsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeArgumentsContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
