import { TypeRefContext } from '@apexdevtools/apex-parser';

import { TypeListTypeClass, ArraySubscriptsTypeClass, TypeVisitor, isArraySubscriptsType } from '.';

import { TypeNameTypeClass, NameVisitor, isTypeNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TypeRefTypeClass extends TypeListTypeClass<TypeNameTypeClass> {
    private dimension: ArraySubscriptsTypeClass | ErrorTypeClass | null = null;

    private constructor(
        value: (TypeNameTypeClass | ErrorTypeClass)[],
        dimension: ArraySubscriptsTypeClass | ErrorTypeClass | null,
    ) {
        super('typeRef', value);
        this.dimension = dimension;
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        if (!ctx.typeName_list() || ctx.typeName_list().length === 0) {
            throw new Error('値が異常です。TypeRefContext: ' + ctx.getText());
        }

        const value = isValidClassList(
            ctx.typeName_list(),
            (ctx) => new NameVisitor().visit(ctx),
            isTypeNameType,
            'typeName',
        );

        let dimension: ArraySubscriptsTypeClass | ErrorTypeClass | null = null;

        if (
            !value.some(
                (typeName) => isTypeNameType(typeName) && typeof typeName.getValue() === 'string',
            )
        ) {
            dimension = new TypeVisitor().visitArraySubscripts(ctx.arraySubscripts());
        }

        return new TypeRefTypeClass(value, dimension);
    }

    getDimension(): ArraySubscriptsTypeClass | ErrorTypeClass | null {
        return this.dimension;
    }
}

export const isTypeRefType = (target: CommonTypeClass): target is TypeRefTypeClass => {
    return target instanceof TypeRefTypeClass;
};
