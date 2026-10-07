import {
    ApexParserBaseVisitor,
    ForControlContext,
    ForInitContext,
    ForUpdateContext,
    EnhancedForControlContext,
    WhenControlContext,
} from '@apexdevtools/apex-parser';

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ControlTypeClass } from './base';

import { ForControlTypeClass } from './forControl';
import { ForInitTypeClass } from './forInit';
import { ForUpdateTypeClass } from './forUpdate';
import { EnhancedForControlTypeClass } from './enhancedForControl';
import { WhenControlTypeClass } from './whenControl';

import { CommonVisitor } from '../commonVisitor';

export { isForControlType, ForControlTypeClass } from './forControl';
export { isForInitType, ForInitTypeClass } from './forInit';
export { isForUpdateType, ForUpdateTypeClass } from './forUpdate';
export { isWhenControlType, WhenControlTypeClass } from './whenControl';
export { isEnhancedForControlType, EnhancedForControlTypeClass } from './enhancedForControl';

export class ControlVisitor extends CommonVisitor<ControlTypeClass<unknown>> {
    visitForControl(ctx: ForControlContext) {
        return ForControlTypeClass.create(ctx);
    }

    visitForInit(ctx: ForInitContext) {
        return ForInitTypeClass.create(ctx);
    }

    visitForUpdate(ctx: ForUpdateContext) {
        return ForUpdateTypeClass.create(ctx);
    }

    visitEnhancedForControl(ctx: EnhancedForControlContext) {
        return EnhancedForControlTypeClass.create(ctx);
    }

    visitWhenControl(ctx: WhenControlContext) {
        return WhenControlTypeClass.create(ctx);
    }
}
