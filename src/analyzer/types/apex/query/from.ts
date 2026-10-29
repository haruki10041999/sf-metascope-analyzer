import typia from 'typia';

import {
    ErrorJson,
    JsonType,
    makeJsonType,
    convertValue,
    ConvertType,
    isErrorNode,
    makeErrorJson,
} from '../commons';

import { FromNameType, FromNameListType } from '../converter';

type FromFieldJson = JsonType<'fromField'> & {
    field: string[];
    alias?: string;
};

const makeFromFieldJson = (target: ConvertType<FromNameType>): FromFieldJson | ErrorJson => {
    return convertValue<'fromName', FromNameType, FromFieldJson>(
        target,
        'fromField',
        (target, targetRecords) => {
            const fromFieldJson: FromFieldJson = makeJsonType('fromField', targetRecords.base, {
                field: target.value.value.map((item) => item.value.value),
            });

            if (target.alias) {
                fromFieldJson.alias = target.alias.value.value;
            }

            return fromFieldJson;
        },
    );
};

export type FromJson = {
    field: (FromFieldJson | ErrorJson)[];
};
export const isFromJson = typia.createIs<FromJson>();

export const makeFromJson = (target: ConvertType<FromNameListType>): FromJson | ErrorJson => {
    if (isErrorNode(target)) {
        return makeErrorJson(target, 'from');
    }

    return {
        field: target.value.map((v) => makeFromFieldJson(v)),
    };
};

