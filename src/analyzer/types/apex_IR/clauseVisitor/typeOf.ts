import { TypeOfContext } from '@apexdevtools/apex-parser';

import {
    WhenClauseTypeClass,
    ElseClauseTypeClass,
    ClauseTypeClass,
    ClauseVisitor,
    isWhenClauseType,
    isElseClauseType,
} from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class TypeOfTypeClass extends ClauseTypeClass<'typeOf', FieldNameTypeClass> {
    private whenClause: (WhenClauseTypeClass | ApexErrorTypeClass)[];
    private elseClause: ElseClauseTypeClass | ApexErrorTypeClass | null = null;

    private constructor(
        value: FieldNameTypeClass | ApexErrorTypeClass,
        whenClause: (WhenClauseTypeClass | ApexErrorTypeClass)[],
        elseClause: ElseClauseTypeClass | ApexErrorTypeClass | null,
    ) {
        super('typeOf', value);
        this.whenClause = whenClause;
        this.elseClause = elseClause;
    }

    static create(ctx: TypeOfContext): TypeOfTypeClass {
        if (!ctx.fieldName() || !ctx.whenClause_list() || ctx.whenClause_list().length === 0) {
            throw new Error('値が異常です。TypeOfContext: ' + ctx.getText());
        }

        return new TypeOfTypeClass(
            isApexValidClass(
                new NameVisitor().visit(ctx.fieldName()),
                isFieldNameType,
                'fieldName',
            ),
            isApexValidClassList(
                ctx.whenClause_list(),
                (ctx) => new ClauseVisitor().visit(ctx),
                isWhenClauseType,
                'whenClause',
            ),
            ctx.elseClause()
                ? isApexValidClass(
                      new ClauseVisitor().visit(ctx.elseClause()),
                      isElseClauseType,
                      'elseClause',
                  )
                : null,
        );
    }

    getWhenClause(): (WhenClauseTypeClass | ApexErrorTypeClass)[] {
        return this.whenClause;
    }

    getElseClause(): ElseClauseTypeClass | ApexErrorTypeClass | null {
        return this.elseClause;
    }
}

export const isTypeOfType = (target: ApexCommonTypeClass<string>): target is TypeOfTypeClass => {
    return target instanceof TypeOfTypeClass;
};

