import typia from 'typia';

import {
    Convert,
    isConvert,
    castExcludeErrorInfo,
    castExcludeErrorInfoArray,
    castConvert,
    castConvertArray,
} from '../commons';

import { SubQueryType } from '../converter';

import { SelectJson, makeSelectJson } from './select';

export type SubQueryJson = {
    type: 'subQuery';
    select: SelectJson;
};

export const isSubQueryJson = typia.createIs<SubQueryJson>();

export const makeSubQueryJson = (target: Convert<SubQueryType>): SubQueryJson => {
    const select = castConvert(castExcludeErrorInfo(target.value));

    return {
        type: 'subQuery',
        select: makeSelectJson(select, []),
    };
};
