import {
    SwitchStatementContext,
    WhenControlContext,
    WhenValueContext,
    WhenLiteralContext,
    QualifiedNameContext,
} from '@apexdevtools/apex-parser';

import { BlockStatemtType, makeBlockStatemtType } from './block';

type SwitchCondition =
    | {
          type: 'condition';
          conditionValue: string[];
          block: Omit<BlockStatemtType, 'type'>;
      }
    | {
          type: 'else';
          block: Omit<BlockStatemtType, 'type'>;
      };

export type SwitchStatementType = {
    type: 'switch';
    variant: string;
    conditions: SwitchCondition[];
};

export const makeSwitchStatementType = (ctx: SwitchStatementContext): SwitchStatementType => {
    const variant = ctx.expression().getText();

    const conditions: SwitchCondition[] = [];

    ctx.whenControl_list().forEach((whenControlCtx) => {
        const { type, ...block } = makeBlockStatemtType(whenControlCtx.block());

        const whenValueCtx = whenControlCtx.whenValue();

        if (whenValueCtx.ELSE()) {
            conditions.push({
                type: 'else',
                block: block,
            });
            return;
        }

        const condition = whenValueCtx.whenLiteral_list().map((literal) => {
            return literal.getText();
        });

        conditions.push({
            type: 'condition',
            conditionValue: condition,
            block: block,
        });
    });

    return {
        type: 'switch',
        variant: variant,
        conditions: conditions,
    };
};
