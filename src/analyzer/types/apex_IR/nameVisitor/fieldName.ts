import { FieldNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FieldNameTypeClass extends NameListTypeClass<SoqlIdTypeClass> {
    private constructor(value: (SoqlIdTypeClass | ErrorTypeClass)[]) {
        super('fieldName', value);
    }

    static create(ctx: FieldNameContext): FieldNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。FieldNameContext: ' + ctx.getText());
        }

        return new FieldNameTypeClass(
            isValidClassList(
                ctx.soqlId_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isSoqlIdType,
                'soqlId',
            ),
        );
    }
}

export const isFieldNameType = (target: CommonTypeClass): target is FieldNameTypeClass => {
    return target instanceof FieldNameTypeClass;
};
