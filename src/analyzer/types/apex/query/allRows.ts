import typia from 'typia';

import { JsonType } from '../../commons';
import type { AllRowsClauseTypeClass } from '../../apex_IR';

import { makeNodeJson } from '../commons/node';

/** ALL ROWS。値は持たない (いつも ALL ROWS なので) */
export type AllRowsJson = JsonType<'allRowsClause'>;

export const isAllRowsJson = typia.createIs<AllRowsJson>();

export const makeAllRowsJson = (target: AllRowsClauseTypeClass): AllRowsJson =>
    makeNodeJson<AllRowsJson>('allRowsClause', target);
