import {
    ApexParserBaseVisitor,
    ArgumentsContext,
    TypeArgumentsContext,
} from '@apexdevtools/apex-parser';

import { ArgumentsType as argumentsType, makeArgumentsType } from './arguments';
import { TypeArgumentsType, makeTypeArgumentsType } from './typeArguments';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export class ArugumentsTypeClass extends ContextTypeClass {
    private args: any | null = null;

    constructor(type: string, args: any | null, errorClasses: ErrorTypeClass[]) {
        super(type, errorClasses);
        (this, (args = args));
    }

    getArgs(): any | null {
        return this.args;
    }
}

export const isArugumentsTypeAll = (target: CommonTypeClass): target is ArugumentsTypeClass => {
    return target instanceof ArugumentsTypeClass;
};

export class ArgumentsVisitor extends CommonVisitor<ArugumentsTypeClass> {
    visitArguments(ctx: ArgumentsContext) {
        console.log('解析を開始します。' + 'ArgumentsContext：:  ' + ctx.getText());
        const result = makeArgumentsType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ArgumentsContext：:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeArguments(ctx: TypeArgumentsContext) {
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
