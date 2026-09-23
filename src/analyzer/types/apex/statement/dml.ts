import {
    InsertStatementContext,
    UpdateStatementContext,
    DeleteStatementContext,
    UpsertStatementContext,
    UndeleteStatementContext,
    MergeStatementContext,
    AccessLevelContext,
} from '@apexdevtools/apex-parser';

export type DmlStatementType =
    | {
          type: 'insert' | 'update' | 'delete' | 'unDelete' | 'upsert';
          variant: string;
          accessLevel: 'NONE' | 'SYSTEM' | 'USER';
      }
    | {
          type: 'merge';
          variants: string[];
          accessLevel: 'NONE' | 'SYSTEM' | 'USER';
      };

export const makeDmlStatementType = (
    ctx:
        | InsertStatementContext
        | UpdateStatementContext
        | DeleteStatementContext
        | UndeleteStatementContext
        | UpsertStatementContext
        | MergeStatementContext,
): DmlStatementType => {
    let accessLevel: 'NONE' | 'SYSTEM' | 'USER' = 'NONE';
    if (ctx.accessLevel().SYSTEM()) {
        accessLevel = 'SYSTEM';
    }

    if (ctx.accessLevel().USER()) {
        accessLevel = 'USER';
    }

    if (ctx instanceof MergeStatementContext) {
        const variants = ctx.expression_list().map((expressionCtx) => {
            return expressionCtx.getText();
        });
        return {
            type: 'merge',
            variants: variants,
            accessLevel: accessLevel,
        };
    }

    let type: 'insert' | 'update' | 'delete' | 'unDelete' | 'upsert';
    const variant = ctx.expression().getText();
    if (ctx instanceof InsertStatementContext) {
        return {
            type: 'insert',
            variant: variant,
            accessLevel: accessLevel,
        };
    }

    if (ctx instanceof UpdateStatementContext) {
        return {
            type: 'update',
            variant: variant,
            accessLevel: accessLevel,
        };
    }

    if (ctx instanceof DeleteStatementContext) {
        return {
            type: 'delete',
            variant: variant,
            accessLevel: accessLevel,
        };
    }

    if (ctx instanceof UndeleteStatementContext) {
        return {
            type: 'unDelete',
            variant: variant,
            accessLevel: accessLevel,
        };
    }

    if (ctx instanceof UpsertStatementContext) {
        return {
            type: 'upsert',
            variant: variant,
            accessLevel: accessLevel,
        };
    }

    throw new Error(`値が異常です`);
};
