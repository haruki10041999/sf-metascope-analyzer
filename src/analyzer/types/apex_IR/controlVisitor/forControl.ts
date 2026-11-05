import { ForControlContext } from '@apexdevtools/apex-parser';

import {
    EnhancedForControlTypeClass,
    ForInitTypeClass,
    ForUpdateTypeClass,
    ControlTypeClass,
    ControlVisitor,
    isEnhancedForControlType,
    isForInitType,
    isForUpdateType,
} from '.';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class ForControlTypeClass extends ControlTypeClass<
    'forControl',
    EnhancedForControlTypeClass | BasedExpressionTypeClass | null
> {
    private init: ForInitTypeClass | ApexErrorTypeClass | null;
    private update: ForUpdateTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: EnhancedForControlTypeClass | BasedExpressionTypeClass | ApexErrorTypeClass | null,
        init: ForInitTypeClass | ApexErrorTypeClass | null,
        update: ForUpdateTypeClass | ApexErrorTypeClass | null,
    ) {
        super('forControl', value);
        this.init = init;
        this.update = update;
    }

    // `for (;;)` のように初期化・条件・更新はすべて任意
    static create(ctx: ForControlContext): ForControlTypeClass {
        let value:
            EnhancedForControlTypeClass | BasedExpressionTypeClass | ApexErrorTypeClass | null =
            null;
        if (ctx.enhancedForControl()) {
            value = visitNode(
                new ControlVisitor(),
                ctx.enhancedForControl(),
                isEnhancedForControlType,
                'enhancedForControl',
            );
        } else if (ctx.expression()) {
            value = visitNode(
                new ExpressionVisitor(),
                ctx.expression(),
                isBasedExpressionType,
                'expression',
            );
        }

        return new ForControlTypeClass(
            value,
            visitOptionalNode(new ControlVisitor(), ctx.forInit(), isForInitType, 'forInit'),
            visitOptionalNode(new ControlVisitor(), ctx.forUpdate(), isForUpdateType, 'forUpdate'),
        );
    }

    getInit(): ForInitTypeClass | ApexErrorTypeClass | null {
        return this.init;
    }

    getUpdate(): ForUpdateTypeClass | ApexErrorTypeClass | null {
        return this.update;
    }
}

export const isForControlType = (
    target: ApexCommonTypeClass<string>,
): target is ForControlTypeClass => {
    return target instanceof ForControlTypeClass;
};
