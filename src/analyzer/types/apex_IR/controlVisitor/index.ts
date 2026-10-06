import {
    ApexParserBaseVisitor,
    ForControlContext,
    ForInitContext,
    ForUpdateContext,
    EnhancedForControlContext,
    WhenControlContext,
} from '@apexdevtools/apex-parser';

import { ForControlTypeClass } from './forControl';
import { ForInitTypeClass } from './forInit';
import { ForUpdateTypeClass } from './forUpdate';
import { EnhancedForControlTypeClass } from './enhancedForControl';
import { WhenControlTypeClass } from './whenControl';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isForControlType, ForControlTypeClass } from './forControl';
export { isForInitType, ForInitTypeClass } from './forInit';
export { isForUpdateType, ForUpdateTypeClass } from './forUpdate';
export { isWhenControlType, WhenControlTypeClass } from './whenControl';
export { isEnhancedForControlType, EnhancedForControlTypeClass } from './enhancedForControl';

export class ControlTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isControlTypeAll = (target: CommonTypeClass): target is ControlTypeClass<unknown> => {
    return target instanceof ControlTypeClass;
};

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
