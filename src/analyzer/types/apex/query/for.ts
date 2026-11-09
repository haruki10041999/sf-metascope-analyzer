import typia from 'typia';

import { JsonType } from '../../commons';
import type { ForClausesTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';

export type ForJson = JsonType<'forClause'> & {
    value: string[];
};
export const isForJson = typia.createIs<ForJson>();

export const makeForJson = (target: ForClausesTypeClass): ForJson => {
    return makeNodeJson<ForJson>('forClause', target, {
        value: [...target.getFields().value],
    });
};
