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
    blockType | FinallyBlockType | PropertyBlockType | AnonymousBlockType | TriggerBlockType;

export class BlockVisitor extends ApexParserBaseVisitor<BlockType> {
    visitBlock(ctx: BlockContext) {
        return makeBlockType(ctx);
    }

    visitFinallyBlock(ctx: FinallyBlockContext) {
        return makeFinallyBlockType(ctx);
    }

    visitPropertyBlock(ctx: PropertyBlockContext) {
        return makePropertyBlockType(ctx);
    }

    visitAnonymousBlock(ctx: AnonymousBlockContext) {
        return makeAnonymousBlockType(ctx);
    }

    visitTriggerBlock(ctx: TriggerBlockContext) {
        return makeTriggerBlockType(ctx);
    }

    visitGetter(ctx: GetterContext) {
        return makeGetterType(ctx);
    }

    visitSetter(ctx: SetterContext) {
        return makeSetterType(ctx);
    }
}
