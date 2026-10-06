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
import { FinallyBlockTypeClass } from './finallyBlock';
import { PropertyBlockTypeClass } from './propertyBlock';
import { GetterTypeClass } from './getter';
import { SetterTypeClass } from './setter';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isNormalBlockType, NormalBlockTypeClass } from './normal';
export { isFinallyBlockType, FinallyBlockTypeClass } from './finallyBlock';
export { isPropertyBlockType, PropertyBlockTypeClass } from './propertyBlock';
export { isGetterType, GetterTypeClass } from './getter';
export { isSetterType, SetterTypeClass } from './setter';

export class BlockTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class BlockListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type BlockAllTypeClass = BlockTypeClass<unknown> | BlockListTypeClass<unknown>;

export const isBlockTypeAll = (target: CommonTypeClass): target is BlockAllTypeClass => {
    return target instanceof BlockTypeClass || target instanceof BlockListTypeClass;
};

export class BlockVisitor extends CommonVisitor<BlockAllTypeClass> {
    visitBlock(ctx: BlockContext) {
        return NormalBlockTypeClass.create(ctx);
    }

    visitFinallyBlock(ctx: FinallyBlockContext) {
        return FinallyBlockTypeClass.create(ctx);
    }

    visitPropertyBlock(ctx: PropertyBlockContext) {
        return PropertyBlockTypeClass.create(ctx);
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
        return GetterTypeClass.create(ctx);
    }

    visitSetter(ctx: SetterContext) {
        return SetterTypeClass.create(ctx);
    }
}
