import {
    ApexParserBaseVisitor,
    ForControlContext,
    EnhancedForControlContext,
    WhenControlContext,
} from '@apexdevtools/apex-parser';

import { ForControlType, makeForControlType } from './forControl';
import { EnhancedForControlType, makeEnhancedForControlType } from './enhancedForControl';
import { WhenControlType, makeWhenControlType } from './whenControl';

export type ControlType = ForControlType | EnhancedForControlType | WhenControlType;

export class ControlVisitor extends ApexParserBaseVisitor<ControlType> {
    visitForControl(ctx: ForControlContext) {
        return makeForControlType(ctx);
    }

    visitEnhancedForControl(ctx: EnhancedForControlContext) {
        return makeEnhancedForControlType(ctx);
    }

    visitWhenControl(ctx: WhenControlContext) {
        return makeWhenControlType(ctx);
    }
}
