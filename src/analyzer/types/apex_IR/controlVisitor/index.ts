import {
    ApexParserBaseVisitor,
    ForControlContext,
    ForInitContext,
    ForUpdateContext,
    EnhancedForControlContext,
    WhenControlContext,
} from '@apexdevtools/apex-parser';

import { ForControlType, makeForControlType } from './forControl';
import { ForInitType, makeForInitType } from './forInit';
import { ForUpdateType, makeForUpdateType } from './forUpdate';
import { EnhancedForControlType, makeEnhancedForControlType } from './enhancedForControl';
import { WhenControlType, makeWhenControlType } from './whenControl';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export class ControllTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isControllTypeAll = (target: CommonTypeClass): target is ContextTypeClass<unknown> => {
    return target instanceof CommonTypeClass;
};

export class ControlVisitor extends CommonVisitor<ControlType> {
    visitForControl(ctx: ForControlContext) {
        console.log('解析を開始します。' + 'ForControlContext:  ' + ctx.getText());
        const result = makeForControlType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForControlContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitForInit(ctx: ForInitContext) {
        console.log('解析を開始します。' + 'ForInitContext:  ' + ctx.getText());
        const result = makeForInitType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForInitContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitForUpdate(ctx: ForUpdateContext) {
        console.log('解析を開始します。' + 'ForUpdateContext:  ' + ctx.getText());
        const result = makeForUpdateType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForUpdateContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitEnhancedForControl(ctx: EnhancedForControlContext) {
        console.log('解析を開始します。' + 'EnhancedForControlContext:  ' + ctx.getText());
        const result = makeEnhancedForControlType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'EnhancedForControlContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhenControl(ctx: WhenControlContext) {
        console.log('解析を開始します。' + 'WhenControlContext:  ' + ctx.getText());
        const result = makeWhenControlType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhenControlContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
