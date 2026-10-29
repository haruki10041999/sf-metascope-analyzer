import typia from 'typia';

import { ConvertType, convertValue, ErrorJson, JsonType, makeJsonType } from './commons';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';
import { FormalParameterType } from './converter';

export type ParameterJson = JsonType<'parameter'> & {
    variant: string;
    variantType: TypeJson | ErrorJson;
    modifier: ModifiersJson;
};

export const isParameterJson = typia.createIs<ParameterJson>();

export const makeParameterJson = (
    target: ConvertType<FormalParameterType>,
): ParameterJson | ErrorJson => {
    return convertValue<'formalParameter', FormalParameterType, ParameterJson>(
        target,
        'parameter',
        (target, targetRecords) => {
            return makeJsonType('parameter', targetRecords.base, {
                variant: target.value.value,
                variantType: makeTypeJson(target.valueType),
                modifier: makeModifiersJson(target.modifier),
            });
        },
    );
};
