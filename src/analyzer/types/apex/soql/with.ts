import {
    WithClauseClass,
    LogicalExpressionClass,
    FieldExpressionClass,
    DataCategorySelectionClass,
    isWithClauseClass,
    isLogicalExpressionClass,
    isFieldExpressionClass,
    isDataCategorySelectionClass,
} from '../converter';

export type WithField = {
    kind: string;
};
