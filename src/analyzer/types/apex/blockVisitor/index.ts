import {
    ApexParserBaseVisitor,
    BlockContext,
    PropertyBlockContext,
    FinallyBlockContext,
} from '@apexdevtools/apex-parser';

import { BlockType as blockType, makeBlockType } from './block';
import { FinallyBlockType, makeFinallyBlockType } from './finallyBlock';
import { PropertyBlockType, makePropertyBlockType } from './propertyBlock';

export type BlockType = blockType | FinallyBlockType | PropertyBlockType;

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
}
