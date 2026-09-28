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

export type ControlType =
    ForControlType | ForInitType | ForUpdateType | EnhancedForControlType | WhenControlType;

export class ControlVisitor extends ApexParserBaseVisitor<ControlType> {
    visitForControl(ctx: ForControlContext) {
        return makeForControlType(ctx);
    }

    visitForInit(ctx: ForInitContext) {
        return makeForInitType(ctx);
    }

    visitForUpdate(ctx: ForUpdateContext) {
        return makeForUpdateType(ctx);
    }

    visitEnhancedForControl(ctx: EnhancedForControlContext) {
        return makeEnhancedForControlType(ctx);
    }

    visitWhenControl(ctx: WhenControlContext) {
        return makeWhenControlType(ctx);
    }
}
