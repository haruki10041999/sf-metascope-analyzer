import { DmlStatementClass, UpsertStatementClass, MergeStatementClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';

export type DmlField =
    | {
          kind: 'insert' | 'update' | 'delete' | 'undelete';
          value: ExpressionType;
          accessLevel?: string;
      }
    | {
          kind: 'upsert';
          value: ExpressionType;
          accessLevel?: string;
          externalKey?: string[];
      }
    | {
          kind: 'merge';
          value: ExpressionType[];
          accessLevel?: string;
      };

export const makeDmlField = (
    type: 'insert' | 'update' | 'delete' | 'undelete',
    dmlStatement: DmlStatementClass,
): DmlField | undefined => {
    const value = makeExpressionType(dmlStatement.getValue());
    const accessLevel = dmlStatement.getAccessLevel();

    if (value) {
        const dmlField: DmlField = {
            kind: type,
            value: value,
        };

        if (accessLevel) {
            dmlField.accessLevel = accessLevel;
        }

        return dmlField;
    }

    return undefined;
};
export const makeUpsertField = (upsertStatement: UpsertStatementClass): DmlField | undefined => {
    const value = makeExpressionType(upsertStatement.getValue());
    const accessLevel = upsertStatement.getAccessLevel();
    const eternalKey = upsertStatement.getKey();

    if (value) {
        const dmlField: DmlField = {
            kind: 'upsert',
            value: value,
        };

        if (accessLevel) {
            dmlField.accessLevel = accessLevel;
        }

        if (eternalKey.length > 0) {
            dmlField.externalKey = eternalKey;
        }

        return dmlField;
    }

    return undefined;
};

export const makeMergeField = (mergeStatement: MergeStatementClass): DmlField | undefined => {
    const value = mergeStatement
        .getValue()
        .map((v) => makeExpressionType(v))
        .filter((v) => v != undefined);
    const accessLevel = mergeStatement.getAccessLevel();

    if (value) {
        const dmlField: DmlField = {
            kind: 'merge',
            value: value,
        };

        if (accessLevel) {
            dmlField.accessLevel = accessLevel;
        }

        return dmlField;
    }

    return undefined;
};
