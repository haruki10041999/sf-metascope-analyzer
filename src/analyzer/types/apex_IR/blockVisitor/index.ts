import {
    AnonymousBlockContext,
    TriggerBlockContext,
    BlockContext,
    PropertyBlockContext,
    FinallyBlockContext,
    GetterContext,
    SetterContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { BlockAllTypeClass } from './base';

import { AnonymousBlockTypeClass } from './anonymousBlock';
import { TriggerBlockTypeClass } from './triggerBlock';
import { NormalBlockTypeClass } from './normal';
import { FinallyBlockTypeClass } from './finallyBlock';
import { PropertyBlockTypeClass } from './propertyBlock';
import { GetterTypeClass } from './getter';
import { SetterTypeClass } from './setter';

import { CommonVisitor } from '../commonVisitor';

export { isNormalBlockType, NormalBlockTypeClass } from './normal';
export { isFinallyBlockType, FinallyBlockTypeClass } from './finallyBlock';
export { isPropertyBlockType, PropertyBlockTypeClass } from './propertyBlock';
export { isGetterType, GetterTypeClass } from './getter';
export { isSetterType, SetterTypeClass } from './setter';
export { isAnonymousBlockType, AnonymousBlockTypeClass } from './anonymousBlock';
export { isTriggerBlockType, TriggerBlockTypeClass } from './triggerBlock';

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
        return AnonymousBlockTypeClass.create(ctx);
    }

    visitTriggerBlock(ctx: TriggerBlockContext) {
        return TriggerBlockTypeClass.create(ctx);
    }

    visitGetter(ctx: GetterContext) {
        return GetterTypeClass.create(ctx);
    }

    visitSetter(ctx: SetterContext) {
        return SetterTypeClass.create(ctx);
    }
}
