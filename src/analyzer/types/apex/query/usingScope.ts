import typia from 'typia';

import { JsonType } from '../../commons';
import type { UsingScopeTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';

export type UsingScopeJson = JsonType<'usingScopeClause'> & {
    value: string;
};
export const isUsingScopeJson = typia.createIs<UsingScopeJson>();

export const makeUsingScopeJson = (target: UsingScopeTypeClass): UsingScopeJson => {
    const fields = target.getFields();
    return makeNodeJson<UsingScopeJson>('usingScopeClause', target, {
        // 決まった値 (scope) は v2 で小文字にそろえてある。知らない値 (unknown) はソースの文字のまま
        value:
            fields.kind === 'scope'
                ? fields.scope
                : fields.value.getFields().value.getFields().value,
    });
};
