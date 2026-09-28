import { ForControlContext } from '@apexdevtools/apex-parser';

import { ControlType, ControlVisitor } from '.';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ForControlType = {
    type: 'forControl';
    control:
        | {
              condition: ControlType;
          }
        | {
              init: ControlType;
              condition: ExpressionType;
              update: ControlType;
          };
};

export const makeForControlType = (ctx: ForControlContext): ForControlType => {
    if (ctx.enhancedForControl()) {
        const condition = new ControlVisitor().visit(ctx.enhancedForControl());
        return {
            type: 'forControl',
            control: {
                condition: condition,
            },
        };
    }

    const init = new ControlVisitor().visit(ctx.forInit());
    const condition = new ExpressionVisitor().visit(ctx.expression());
    const update = new ControlVisitor().visit(ctx.forUpdate());

    return {
        type: 'forControl',
        control: {
            init: init,
            condition: condition,
            update: update,
        },
    };
};
