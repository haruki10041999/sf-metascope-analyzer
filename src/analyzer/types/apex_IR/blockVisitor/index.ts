import {
    ApexParserBaseVisitor,
    AnonymousBlockContext,
    TriggerBlockContext,
    BlockContext,
    PropertyBlockContext,
    FinallyBlockContext,
    GetterContext,
    SetterContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockType, makeAnonymousBlockType } from './anonymousBlock';
import { TriggerBlockType, makeTriggerBlockType } from './triggerBlock';
import { NormalBlockTypeClass } from './normal';
import { FinallyBlockType, makeFinallyBlockType } from './finallyBlock';
import { PropertyBlockType, makePropertyBlockType } from './propertyBlock';
import { GetterType, makeGetterType } from './getter';
import { SetterType, makeSetterType } from './setter';

import { ErrorTypeClass, ContextTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalBlockType, NormalBlockTypeClass } from './normal';

export class BlockTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isBlockTypeAll = (target: CommonTypeClass): target is BlockTypeClass<unknown> => {
    return target instanceof BlockTypeClass;
};

export class BlockVisitor extends CommonVisitor<BlockTypeClass<unknown>> {
    visitBlock(ctx: BlockContext) {
        return NormalBlockTypeClass.create(ctx);
    }

    visitFinallyBlock(ctx: FinallyBlockContext) {
        console.log('解析を開始します。' + 'FinallyBlockContext:  ' + ctx.getText());
        const result = makeFinallyBlockType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FinallyBlockContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitPropertyBlock(ctx: PropertyBlockContext) {
        console.log('解析を開始します。' + 'PropertyBlockContext:  ' + ctx.getText());
        const result = makePropertyBlockType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'PropertyBlockContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAnonymousBlock(ctx: AnonymousBlockContext) {
        console.log('解析を開始します。' + 'AnonymousBlockContext:  ' + ctx.getText());
        const result = makeAnonymousBlockType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AnonymousBlockContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTriggerBlock(ctx: TriggerBlockContext) {
        console.log('解析を開始します。' + 'TriggerBlockContext:  ' + ctx.getText());
        const result = makeTriggerBlockType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TriggerBlockContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitGetter(ctx: GetterContext) {
        console.log('解析を開始します。' + 'GetterContext:  ' + ctx.getText());
        const result = makeGetterType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'GetterContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSetter(ctx: SetterContext) {
        console.log('解析を開始します。' + 'SetterContext:  ' + ctx.getText());
        const result = makeSetterType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SetterContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
