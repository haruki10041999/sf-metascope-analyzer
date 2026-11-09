import typia from 'typia';

import { ErrorJson, JsonType } from '../commons';
import type { FormalParameterTypeClass } from '../apex_IR_v2';

import { makeNodeJson } from './commons/node';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';

export type ParameterJson = JsonType<'parameter'> & {
    variant: string;
    variantType: TypeJson | ErrorJson;
    modifier: ModifiersJson;
};

export const isParameterJson = typia.createIs<ParameterJson>();

export const makeParameterJson = (target: FormalParameterTypeClass): ParameterJson => {
    const { name, valueType, modifiers } = target.getFields();
    return makeNodeJson<ParameterJson>('parameter', target, {
        variant: name.getFields().value,
        variantType: makeTypeJson(valueType),
        modifier: makeModifiersJson(modifiers),
    });
};
