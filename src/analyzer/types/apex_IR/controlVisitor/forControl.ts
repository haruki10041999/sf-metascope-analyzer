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
    ExpressionAllTypeClass,
    ExpressionVisitor,
    isExpressionTypeAll,
} from '../expressionVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ForControlTypeClass extends ControlTypeClass<
    EnhancedForControlTypeClass | ExpressionAllTypeClass | null
> {
    private init: ForInitTypeClass | ErrorTypeClass | null;
    private update: ForUpdateTypeClass | ErrorTypeClass | null;

    private constructor(
        value: EnhancedForControlTypeClass | ExpressionAllTypeClass | ErrorTypeClass | null,
        init: ForInitTypeClass | ErrorTypeClass | null,
        update: ForUpdateTypeClass | ErrorTypeClass | null,
    ) {
        super('forControl', value);
        this.init = init;
        this.update = update;
    }

    // `for (;;)` のように初期化・条件・更新はすべて任意
    static create(ctx: ForControlContext): ForControlTypeClass {
        let value: EnhancedForControlTypeClass | ExpressionAllTypeClass | ErrorTypeClass | null =
            null;
        if (ctx.enhancedForControl()) {
            value = isValidClass(
                new ControlVisitor().visit(ctx.enhancedForControl()),
                isEnhancedForControlType,
                'enhancedForControl',
            );
        } else if (ctx.expression()) {
            value = isValidClass(
                new ExpressionVisitor().visit(ctx.expression()),
                isExpressionTypeAll,
                'expression',
            );
        }

        return new ForControlTypeClass(
            value,
            ctx.forInit()
                ? isValidClass(new ControlVisitor().visit(ctx.forInit()), isForInitType, 'forInit')
                : null,
            ctx.forUpdate()
                ? isValidClass(
                      new ControlVisitor().visit(ctx.forUpdate()),
                      isForUpdateType,
                      'forUpdate',
                  )
                : null,
        );
    }
}

export const isForControlType = (target: CommonTypeClass): target is ForControlTypeClass => {
    return target instanceof ForControlTypeClass;
};
