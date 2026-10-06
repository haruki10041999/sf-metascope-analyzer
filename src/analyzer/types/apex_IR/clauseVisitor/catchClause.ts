import { CatchClauseContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { CommonTypeClass, ErrorTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class CatchClauseTypeClass extends ClauseTypeClass<NormalIdTypeClass> {
    private valueType: QualifiedNameTypeClass | ErrorTypeClass;
    private block: NormalBlockTypeClass | ErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[];

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: QualifiedNameTypeClass | ErrorTypeClass,
        block: NormalBlockTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            ),
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
            isValidClassList(
                ctx.modifier_list() || [],
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getValueType(): QualifiedNameTypeClass | ErrorTypeClass {
        return this.valueType;
    }

    getBlock(): NormalBlockTypeClass | ErrorTypeClass {
        return this.block;
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isCatchClauseType = (target: CommonTypeClass): target is CatchClauseTypeClass => {
    return target instanceof CatchClauseTypeClass;
};
