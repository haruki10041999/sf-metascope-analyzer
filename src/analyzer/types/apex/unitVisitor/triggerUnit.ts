import { TriggerUnitContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

import { TriggerCaseType, makeTriggerCaseType } from '../triggerCase';

export type TriggerUnitType = {
    type: 'triggerUnit';
    idList: Omit<IdType, 'type'>[];
    caseList: Omit<TriggerCaseType, 'type'>[];
    block: Omit<BlockType, 'type'>;
};

export const makeTriggerUnitType = (ctx: TriggerUnitContext): TriggerUnitType => {
    const idList = ctx.id_list().map((Idctx) => {
        const { type, ...id } = new IdVisitor().visit(Idctx);
        return id;
    });

    const caseList = ctx.triggerCase_list().map((triggerCaseCtx) => {
        const { type, ...triggerCaseType } = makeTriggerCaseType(triggerCaseCtx);
        return triggerCaseType;
    });

    const { type, ...block } = new BlockVisitor().visit(ctx.triggerBlock());

    return {
        type: 'triggerUnit',
        idList: idList,
        caseList: caseList,
        block: block,
    };
};
