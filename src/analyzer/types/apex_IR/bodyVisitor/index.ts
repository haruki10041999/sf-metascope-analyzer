import {
    ApexParserBaseVisitor,
    ClassBodyContext,
    InterfaceBodyContext,
} from '@apexdevtools/apex-parser';

import { ClassBodyType, makeClassBodyType } from './classBody';
import { InterfaceBodyType, makeInterfaceBodyType } from './interfaceBody';

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type BodyType = ClassBodyType | InterfaceBodyType | ErrorType;

export class BodyVisitor extends CommonVisitor<BodyType> {
    visitClassBody(ctx: ClassBodyContext) {
        console.log('解析を開始します。' + 'ClassBodyContext:  ' + ctx.getText());
        const result = makeClassBodyType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ClassBodyContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitInterfaceBody(ctx: InterfaceBodyContext) {
        console.log('解析を開始します。' + 'InterfaceBodyContext:  ' + ctx.getText());
        const result = makeInterfaceBodyType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'InterfaceBodyContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
