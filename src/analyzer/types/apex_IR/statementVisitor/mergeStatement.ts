import { MergeStatementContext } from '@apexdevtools/apex-parser';

import { AccessLevelTypeClass } from './accessLevel';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** `MERGE accessLevel? 統合先 統合元;` */
export type MergeStatementType = TypeField<'mergeStatement'> & {
    /** 統合先 (1 つ目の式) */
    master: BasedExpressionTypeClass;
    /** 統合元 (2 つ目の式) */
    merged: BasedExpressionTypeClass;
    accessLevel: AccessLevelTypeClass | null;
};

export class MergeStatementTypeClass extends ApexCommonTypeClass<
    'mergeStatement',
    MergeStatementType
> {
    private constructor(fields: FieldsOf<MergeStatementType>, sourceSpan: SourceSpan) {
        super('mergeStatement', fields, sourceSpan);
    }

    static create(ctx: MergeStatementContext): MergeStatementTypeClass {
        return new MergeStatementTypeClass(
            {
                master: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(0),
                    isBasedExpressionType,
                    'expression',
                ),
                merged: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(1),
                    isBasedExpressionType,
                    'expression',
                ),
                accessLevel: createOptionalNode(
                    ctx.accessLevel(),
                    (c) => AccessLevelTypeClass.create(c),
                    'accessLevel',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getMaster(): MergeStatementType['master'] {
        return this.getFields().master;
    }

    getMerged(): MergeStatementType['merged'] {
        return this.getFields().merged;
    }

    getAccessLevel(): MergeStatementType['accessLevel'] {
        return this.getFields().accessLevel;
    }
}

export const isMergeStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is MergeStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('mergeStatement', target);
};
