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
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TypeOfTypeClass extends ClauseTypeClass<FieldNameTypeClass> {
    private whenClause: (WhenClauseTypeClass | ErrorTypeClass)[];
    private elseClause: ElseClauseTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: FieldNameTypeClass | ErrorTypeClass,
        whenClause: (WhenClauseTypeClass | ErrorTypeClass)[],
        elseClause: ElseClauseTypeClass | ErrorTypeClass | null,
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
            isValidClass(new NameVisitor().visit(ctx.fieldName()), isFieldNameType, 'fieldName'),
            isValidClassList(
                ctx.whenClause_list(),
                (ctx) => new ClauseVisitor().visit(ctx),
                isWhenClauseType,
                'whenClause',
            ),
            ctx.elseClause()
                ? isValidClass(
                      new ClauseVisitor().visit(ctx.elseClause()),
                      isElseClauseType,
                      'elseClause',
                  )
                : null,
        );
    }

    getWhenClause(): (WhenClauseTypeClass | ErrorTypeClass)[] {
        return this.whenClause;
    }

    getElseClause(): ElseClauseTypeClass | ErrorTypeClass | null {
        return this.elseClause;
    }
}

export const isTypeOfType = (target: CommonTypeClass): target is TypeOfTypeClass => {
    return target instanceof TypeOfTypeClass;
};
