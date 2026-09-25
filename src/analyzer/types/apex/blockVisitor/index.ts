import {
    ApexParserBaseVisitor,
    AnonymousBlockContext,
    TriggerBlockContext,
    BlockContext,
    PropertyBlockContext,
    FinallyBlockContext,
} from '@apexdevtools/apex-parser';

import { AnonymousBlockType, makeAnonymousBlockType } from './anonymousBlock';
import { TriggerBlockType, makeTriggerBlockType } from './triggerBlock';
import { BlockType as blockType, makeBlockType } from './block';
import { FinallyBlockType, makeFinallyBlockType } from './finallyBlock';
import { PropertyBlockType, makePropertyBlockType } from './propertyBlock';

export type BlockType = blockType | FinallyBlockType | PropertyBlockType | AnonymousBlockType;

export class BlockVisitor extends ApexParserBaseVisitor<BlockType> {
    visitBlockContext(ctx: BlockContext) {
        return makeBlockType(ctx);
    }

    visitFinallyBlockContext(ctx: FinallyBlockContext) {
        return makeFinallyBlockType(ctx);
    }

    visitPropertyBlockContext(ctx: PropertyBlockContext) {
        return makePropertyBlockType(ctx);
    }

    visitAnonymousBlockContext(ctx: AnonymousBlockContext) {
        return makeAnonymousBlockType(ctx);
    }

    visitTriggerBlockContext(ctx: TriggerBlockContext) {
        return makeTriggerBlockType(ctx);
    }
}
