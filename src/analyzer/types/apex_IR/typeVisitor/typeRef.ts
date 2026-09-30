import { TypeRefContext } from '@apexdevtools/apex-parser';

import { TypeTypeClass, ArraySubscriptsTypeClass, TypeVisitor, isArraySubscriptsType } from '.';

import { TypeNameTypeClass, NameVisitor, isTypeNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class TypeRefTypeClass extends TypeTypeClass<TypeNameTypeClass[]> {
    private dimension: ArraySubscriptsTypeClass | null = null;

    private constructor(
        value: TypeNameTypeClass[],
        dimension: ArraySubscriptsTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('typeRef', value, errorClasses);
        this.dimension = dimension;
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        if (!ctx.typeName_list() || ctx.typeName_list().length === 0) {
            throw new Error('値が異常です。TypeRefContext: ' + ctx.getText());
        }

        const value: TypeNameTypeClass[] = [];
        let dimension: ArraySubscriptsTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.typeName_list().forEach((typeNameCtx, index) => {
            const nameTypeClass = new NameVisitor().visit(typeNameCtx);

            if (isTypeNameType(nameTypeClass)) {
                value.push(nameTypeClass);
            } else if (isErrorType(nameTypeClass)) {
                errorClasses[`value_${index}`] = nameTypeClass;
            } else {
                throw new Error(
                    '想定したタイプと違います　想定：typeName、実値：' + nameTypeClass.getType(),
                );
            }
        });

        if (!value.some((typeName) => typeName.getGeneric() !== null)) {
            const typeTypeClass = new TypeVisitor().visit(ctx.arraySubscripts());
            if (isArraySubscriptsType(typeTypeClass)) {
                dimension = typeTypeClass;
            } else if (isErrorType(typeTypeClass)) {
                errorClasses['dimension'] = typeTypeClass;
            } else {
                throw new Error(
                    '想定したタイプと違います　想定：arraySubscripts、実値：' +
                        typeTypeClass.getType(),
                );
            }
        }

        return new TypeRefTypeClass(value, dimension, errorClasses);
    }

    getDimension(): ArraySubscriptsTypeClass | null {
        return this.dimension;
    }

    isDimensionNull(): boolean {
        return this.dimension === null;
    }
}

export const isTypeRefType = (target: any): target is TypeRefTypeClass => {
    return target instanceof TypeRefTypeClass;
};
