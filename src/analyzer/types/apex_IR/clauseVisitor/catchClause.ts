import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class CatchClauseTypeClass extends ClauseTypeClass<'catchClause', NormalIdTypeClass> {
    private valueType: QualifiedNameTypeClass | ApexErrorTypeClass;
    private block: NormalBlockTypeClass | ApexErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[];

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: QualifiedNameTypeClass | ApexErrorTypeClass,
        block: NormalBlockTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('catchClause', value);
        this.valueType = valueType;
        this.block = block;
        this.modifier = modifier;
    }

    static create(ctx: CatchClauseContext): CatchClauseTypeClass {
        if (!ctx.qualifiedName() || !ctx.id() || !ctx.block()) {
            throw new Error('値が異常です。CatchClauseContext: ' + ctx.getText());
        }

        return new CatchClauseTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            visitNode(new NameVisitor(), ctx.qualifiedName(), isQualifiedNameType, 'qualifiedName'),
            visitNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list() || [],
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getValueType(): QualifiedNameTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }

    getBlock(): NormalBlockTypeClass | ApexErrorTypeClass {
        return this.block;
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isCatchClauseType = (
    target: ApexCommonTypeClass<string>,
): target is CatchClauseTypeClass => {
    return target instanceof CatchClauseTypeClass;
};
