import { ForControlContext } from '@apexdevtools/apex-parser';

import { ControlType, ControlVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { ForInitType, makeForInitType } from '../forInit';
import { ForUpdateType, makeForUpdateType } from '../forUpdate';

export type ForControlType = {
    type: 'forControl';
} & (
    | {
          condition: Omit<ControlType, 'type'>;
      }
    | {
          init: Omit<ForInitType, 'type'>;
          condition: Omit<ExpressionType, 'type'>;
          update: Omit<ForUpdateType, 'type'>;
      }
);

export const makeForControlType = (ctx: ForControlContext): ForControlType => {
    if (ctx.enhancedForControl()) {
        const { type, ...condition } = new ControlVisitor().visit(ctx.enhancedForControl());
        return {
            type: 'forControl',
            condition: condition,
        };
    }

    const { type: initType, ...init } = makeForInitType(ctx.forInit());
    const { type: conditionType, ...condition } = new ExpressionVisitor().visit(ctx.expression());
    const { type: updateType, ...update } = makeForUpdateType(ctx.forUpdate());

    return {
        type: 'forControl',
        init: init,
        condition: condition,
        update: update,
    };
};
