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
    EnhancedForControlTypeClass | ExpressionAllTypeClass
> {
    private init: ForInitTypeClass | ErrorTypeClass | null;
    private update: ForUpdateTypeClass | ErrorTypeClass | null;

    private constructor(
        value: EnhancedForControlTypeClass | ExpressionAllTypeClass | ErrorTypeClass,
        init: ForInitTypeClass | ErrorTypeClass | null,
        update: ForUpdateTypeClass | ErrorTypeClass | null,
    ) {
        super('forControl', value);
        this.init = init;
        this.update = update;
    }

    static create(ctx: ForControlContext): ForControlTypeClass {
        if (!ctx.enhancedForControl() && !ctx.expression()) {
            throw new Error('値が異常です。ForControlContext: ' + ctx.getText());
        }

        return new ForControlTypeClass(
            ctx.enhancedForControl()
                ? isValidClass(
                      new ControlVisitor().visit(ctx.enhancedForControl()),
                      isEnhancedForControlType,
                      'enhancedForControl',
                  )
                : isValidClass(
                      new ExpressionVisitor().visit(ctx.expression()),
                      isExpressionTypeAll,
                      'expression',
                  ),
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
