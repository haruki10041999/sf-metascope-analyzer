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
import { BlockType as blockType, makeBlockType } from './block';
import { FinallyBlockType, makeFinallyBlockType } from './finallyBlock';
import { PropertyBlockType, makePropertyBlockType } from './propertyBlock';
import { GetterType, makeGetterType } from './getter';
import { SetterType, makeSetterType } from './setter';

export type BlockType =
    | blockType
    | FinallyBlockType
    | PropertyBlockType
    | AnonymousBlockType
    | TriggerBlockType
    | GetterType
    | SetterType;

export class BlockVisitor extends ApexParserBaseVisitor<BlockType> {
    visitBlock(ctx: BlockContext) {
        console.log('解析を開始します。' + 'BlockContext:  ' + ctx.getText());
        const result = makeBlockType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'BlockContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
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
