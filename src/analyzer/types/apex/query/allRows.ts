import typia from 'typia';

import { JsonType } from '../../commons';
import type { AllRowsClauseTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';

export type AllRowsJson = JsonType<'allRowsClause'> & {
    value: string;
};

export const isAllRowsJson = typia.createIs<AllRowsJson>();

// v2 の value は常に 'ALL ROWS' (ソースの大文字・小文字にかかわらずそろえる)
export const makeAllRowsJson = (target: AllRowsClauseTypeClass): AllRowsJson => {
    return makeNodeJson<AllRowsJson>('allRowsClause', target, {
        value: target.getFields().value,
    });
};
