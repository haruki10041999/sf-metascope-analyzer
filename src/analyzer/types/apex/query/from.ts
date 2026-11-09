import typia from 'typia';

import { ErrorJson, JsonType } from '../../commons';
import type { FromNameListTypeClass, FromNameTypeClass } from '../../apex_IR_v2';

import { makeNodeJson } from '../commons/node';

type FromFieldJson = JsonType<'fromField'> & {
    field: string[];
    alias?: string;
};

const makeFromFieldJson = (target: FromNameTypeClass): FromFieldJson => {
    const { value, alias } = target.getFields();
    const fromFieldJson = makeNodeJson<FromFieldJson>('fromField', target, {
        field: value.getFields().value.map((item) => item.getFields().value.getFields().value),
    });

    if (alias) {
        fromFieldJson.alias = alias.getFields().value.getFields().value;
    }

    return fromFieldJson;
};

export type FromJson = {
    field: (FromFieldJson | ErrorJson)[];
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (target: FromNameListTypeClass): FromJson => {
    return {
        field: target.getFields().value.map((v) => makeFromFieldJson(v)),
    };
};
