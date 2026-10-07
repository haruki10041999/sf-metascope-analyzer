import { TypeRefContext } from '@apexdevtools/apex-parser';

import {
    TypeListBaseTypeClass,
    ArraySubscriptsTypeClass,
    TypeVisitor,
    isArraySubscriptsType,
} from '.';

import { TypeNameTypeClass, NameVisitor, isTypeNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class TypeRefTypeClass extends TypeListBaseTypeClass<TypeNameTypeClass> {
    private dimension: ArraySubscriptsTypeClass | ErrorTypeClass;

    private constructor(
        value: (TypeNameTypeClass | ErrorTypeClass)[],
        dimension: ArraySubscriptsTypeClass | ErrorTypeClass,
    ) {
        super('typeRef', value);
        this.dimension = dimension;
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        if (ctx.typeName_list().length === 0 || !ctx.arraySubscripts()) {
            throw new Error('値が異常です。TypeRefContext: ' + ctx.getText());
        }

        return new TypeRefTypeClass(
            isValidClassList(
                ctx.typeName_list(),
                (ctx) => new NameVisitor().visit(ctx),
                isTypeNameType,
                'typeName',
            ),
            isValidClass(
                new TypeVisitor().visit(ctx.arraySubscripts()),
                isArraySubscriptsType,
                'arraySubscripts',
            ),
        );
    }

    getDimension(): ArraySubscriptsTypeClass | ErrorTypeClass {
        return this.dimension;
    }
}

export const isTypeRefType = (target: CommonTypeClass): target is TypeRefTypeClass => {
    return target instanceof TypeRefTypeClass;
};
