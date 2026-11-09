import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { BlockTypeClass } from '../blockVisitor';
import { QualifiedNameTypeClass } from '../nameVisitor';
import { ModifierTypeClass } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CatchClauseType = TypeField<'catchClause'> & {
    value: IdTypeClass;
    valueType: QualifiedNameTypeClass;
    block: BlockTypeClass;
    modifier: ModifierTypeClass[];
};

export class CatchClauseTypeClass extends ApexCommonTypeClass<'catchClause', CatchClauseType> {
    private constructor(fields: FieldsOf<CatchClauseType>, sourceSpan: SourceSpan) {
        super('catchClause', fields, sourceSpan);
    }

    static create(ctx: CatchClauseContext): CatchClauseTypeClass {
        return new CatchClauseTypeClass(
            {
                value: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                valueType: createNode(
                    ctx.qualifiedName(),
                    (c) => QualifiedNameTypeClass.create(c),
                    'qualifiedName',
                ),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
                modifier: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): CatchClauseType['value'] {
        return this.getFields().value;
    }

    getValueType(): CatchClauseType['valueType'] {
        return this.getFields().valueType;
    }

    getBlock(): CatchClauseType['block'] {
        return this.getFields().block;
    }

    getModifier(): CatchClauseType['modifier'] {
        return this.getFields().modifier;
    }
}

export const isCatchClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CatchClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('catchClause', target);
};
