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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

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
            value = isApexValidClass(
                new ControlVisitor().visit(ctx.enhancedForControl()),
                isEnhancedForControlType,
                'enhancedForControl',
            );
        } else if (ctx.expression()) {
            value = isApexValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isBasedExpressionType,
                'expression',
            );
        }

        return new ForControlTypeClass(
            value,
            ctx.forInit()
                ? isApexValidClass(
                      new ControlVisitor().visit(ctx.forInit()),
                      isForInitType,
                      'forInit',
                  )
                : null,
            ctx.forUpdate()
                ? isApexValidClass(
                      new ControlVisitor().visit(ctx.forUpdate()),
                      isForUpdateType,
                      'forUpdate',
                  )
                : null,
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
