import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    isApexValidClass,
    isApexValidClassList,
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
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isApexValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            ),
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
            isApexValidClassList(
                ctx.modifier_list() || [],
                (ctx) => new ModifierVisitor().visit(ctx),
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
