import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { UnitType, UnitVisitor } from '.';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

export type TriggerUnitType = {
    type: 'triggerUnit';
    unit: {
        idList: IdType[];
        caseList: UnitType[];
        block: BlockType;
    };
};

export const makeTriggerUnitType = (ctx: TriggerUnitContext): TriggerUnitType => {
    if (
        (!ctx.id_list() || ctx.id_list().length === 0) &&
        (!ctx.triggerCase_list() || ctx.triggerCase_list().length === 0) &&
        !ctx.triggerBlock()
    ) {
        throw new Error('値が異常です。TriggerUnitContext: ' + ctx.getText());
    }

    const idList = ctx.id_list().map((Idctx) => {
        const id = new IdVisitor().visit(Idctx);
        return id;
    });

    const caseList = ctx.triggerCase_list().map((triggerCaseCtx) => {
        const triggerCaseType = new UnitVisitor().visit(triggerCaseCtx);
        return triggerCaseType;
    });

    const block = new BlockVisitor().visit(ctx.triggerBlock());

    return {
        type: 'triggerUnit',
        unit: {
            idList: idList,
            caseList: caseList,
            block: block,
        },
    };
};

