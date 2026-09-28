import {
    ApexParserBaseVisitor,
    FormalParameterContext,
    FormalParametersContext,
    SoqlFieldsParameterContext,
} from '@apexdevtools/apex-parser';

import { FormalParameterType, makeFormalParameterType } from './formalParameter';
import { FormalParametersType, makeFormalParametersType } from './formalParameters';
import { SoqlFieldsParameterType, makeSoqlFieldsParameterType } from './soqlFieldsParameter';

export type ParameterType = FormalParameterType | SoqlFieldsParameterType | FormalParametersType;

export class ParameterVisitor extends ApexParserBaseVisitor<ParameterType> {
    visitFormalParameter(ctx: FormalParameterContext) {
        console.log('解析を開始します。' + 'FormalParameterContext:  ' + ctx.getText());
        const result = makeFormalParameterType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FormalParameterContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFormalParameters(ctx: FormalParametersContext) {
        console.log('解析を開始します。' + 'FormalParametersContext:  ' + ctx.getText());
        const result = makeFormalParametersType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FormalParametersContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoqlFieldsParameter(ctx: SoqlFieldsParameterContext) {
        console.log('解析を開始します。' + 'SoqlFieldsParameterContext:  ' + ctx.getText());
        const result = makeSoqlFieldsParameterType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoqlFieldsParameterContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
