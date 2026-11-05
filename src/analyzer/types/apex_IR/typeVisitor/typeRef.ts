import { TypeRefContext } from '@apexdevtools/apex-parser';

import {
    TypeListBaseTypeClass,
    ArraySubscriptsTypeClass,
    TypeVisitor,
    isArraySubscriptsType,
} from '.';

import { TypeNameTypeClass, NameVisitor, isTypeNameType } from '../nameVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class TypeRefTypeClass extends TypeListBaseTypeClass<'typeRef', TypeNameTypeClass> {
    private dimension: ArraySubscriptsTypeClass | ApexErrorTypeClass;

    private constructor(
        value: (TypeNameTypeClass | ApexErrorTypeClass)[],
        dimension: ArraySubscriptsTypeClass | ApexErrorTypeClass,
    ) {
        super('typeRef', value);
        this.dimension = dimension;
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        if (ctx.typeName_list().length === 0 || !ctx.arraySubscripts()) {
            throw new Error('値が異常です。TypeRefContext: ' + ctx.getText());
        }

        return new TypeRefTypeClass(
            visitNodeList(new NameVisitor(), ctx.typeName_list(), isTypeNameType, 'typeName'),
            visitNode(
                new TypeVisitor(),
                ctx.arraySubscripts(),
                isArraySubscriptsType,
                'arraySubscripts',
            ),
        );
    }

    getDimension(): ArraySubscriptsTypeClass | ApexErrorTypeClass {
        return this.dimension;
    }
}

export const isTypeRefType = (target: ApexCommonTypeClass<string>): target is TypeRefTypeClass => {
    return target instanceof TypeRefTypeClass;
};
