import { DataCategorySelectionJson, ErrorJson, WithJson, isErrorJson } from '../../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    ValueDiff,
    getValueKey,
    makeNodeDiff,
    makeSetDiff,
    makeValueDiff,
} from '../commons';
import { ValueListItemDiff, makeUnorderedValueListDiff } from './commons';
import { LogicalConditionDiff, makeLogicalConditionDiff } from './where';

export type DataCategorySelectionDiff = NodeDiff<
    'categoryCondition',
    DataCategorySelectionJson,
    {
        group: ValueDiff<string>;
        selector: ValueDiff<DataCategorySelectionJson['selector']>;
        category: ValueListItemDiff<string>[];
    }
>;

export const makeDataCategorySelectionDiff = (
    before: DataCategorySelectionJson | ErrorJson,
    after: DataCategorySelectionJson | ErrorJson,
    match: Match = 'slot',
): DataCategorySelectionDiff =>
    makeNodeDiff('categoryCondition', before, after, match, (b, a) => ({
        group: makeValueDiff(b.group, a.group),
        selector: makeValueDiff(b.selector, a.selector),
        category: makeUnorderedValueListDiff(b.category, a.category),
    }));

export type WithFieldsDiff =
    | { mode: ValueDiff<'SYSTEM_MODE' | 'USER_MODE' | 'SECURITY_ENFORCED'> }
    | { mode: LogicalConditionDiff }
    | {
          mode: ValueDiff<'DATA_CATEGORY'>;
          selection:
              | ListItemDiff<
                    'categoryCondition',
                    DataCategorySelectionJson | ErrorJson,
                    DataCategorySelectionDiff
                >[]
              | ValueDiff<(DataCategorySelectionJson | ErrorJson)[] | ErrorJson>;
      };

export type WithDiff =
    ValueDiff<WithJson | ErrorJson> | { status: 'changed'; fields: WithFieldsDiff };

export const makeWithDiff = (
    before: WithJson | ErrorJson,
    after: WithJson | ErrorJson,
): WithDiff => {
    if (isErrorJson(before) || isErrorJson(after) || getValueKey(before) === getValueKey(after)) {
        return makeValueDiff(before, after);
    }

    if (typeof before.mode === 'string' && typeof after.mode === 'string') {
        if (before.mode === 'DATA_CATEGORY' && after.mode === 'DATA_CATEGORY') {
            const beforeSelection = before.selection;
            const afterSelection = after.selection;
            return {
                status: 'changed',
                fields: {
                    mode: makeValueDiff(before.mode, after.mode),
                    selection:
                        Array.isArray(beforeSelection) && Array.isArray(afterSelection)
                            ? makeSetDiff(
                                  'categoryCondition',
                                  beforeSelection,
                                  afterSelection,
                                  makeDataCategorySelectionDiff,
                              )
                            : makeValueDiff(beforeSelection, afterSelection),
                },
            };
        }
        if (before.mode === 'DATA_CATEGORY' || after.mode === 'DATA_CATEGORY') {
            return makeValueDiff(before, after);
        }
        return {
            status: 'changed',
            fields: { mode: makeValueDiff(before.mode, after.mode) },
        };
    }
    if (typeof before.mode !== 'string' && typeof after.mode !== 'string') {
        return {
            status: 'changed',
            fields: { mode: makeLogicalConditionDiff(before.mode, after.mode) },
        };
    }
    return makeValueDiff(before, after);
};
