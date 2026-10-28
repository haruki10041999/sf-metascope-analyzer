import typia from 'typia';

import {
    Convert,
    ConvertExcludeError,
    ConvertType,
    convertValue,
    ErrorJson,
    JsonType,
    makeJsonType,
} from './commons';

import { LocalVariableDeclarationType } from './converter';
import { BaseExpressionJson, makeExpressionJsonConvert } from './expression';
import { TypeJson, makeTypeJson } from './type';
import { ModifiersJson, makeModifiersJson } from './modifier';

export type LocalVariableDeclarationJson = {
    variants: {
        name: string;
        init?: BaseExpressionJson | ErrorJson;
    }[];
    variantsType: TypeJson | ErrorJson;
    modifier: ModifiersJson;
};

export const isLocalVariableDeclarationJson = typia.createIs<LocalVariableDeclarationJson>();

export const makeLocalVariableDeclarationJson = (
    target: ConvertExcludeError<LocalVariableDeclarationType>,
): LocalVariableDeclarationJson => {
    return {
        variants: target.value.value.map((v) => {
            return {
                name: v.value.value,
                ...(v.init ? { init: makeExpressionJsonConvert(v.init) } : {}),
            };
        }),
        variantsType: makeTypeJson(target.valueType),
        modifier: makeModifiersJson(target.modifier),
    };
};
