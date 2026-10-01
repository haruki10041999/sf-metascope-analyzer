import { TypeNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { TypeArgumentsTypeClass, ArgumentsVisitor, isTypeArgumentsType } from '../argumentsVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class TypeNameTypeClass extends NameTypeClass<NormalIdTypeClass | 'list' | 'set' | 'map'> {
    private generic: TypeArgumentsTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | 'list' | 'set' | 'map' | null,
        generic: TypeArgumentsTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('typeName', value, errorClasses);
        this.generic = generic;
    }

    static create(ctx: TypeNameContext): TypeNameTypeClass {
        if (!ctx.LIST() && !ctx.SET() && !ctx.MAP() && ctx.typeArguments() && !ctx.id()) {
            throw new Error('値が異常です。TypeNameContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | 'list' | 'set' | 'map' | null = null;
        let generic: TypeArgumentsTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.LIST() || ctx.SET() || ctx.MAP()) {
            value = ctx.LIST() ? 'list' : ctx.SET() ? 'set' : 'map';
            const argumentsTypeClass = new ArgumentsVisitor().visit(ctx.typeArguments());
            if (isTypeArgumentsType(argumentsTypeClass)) {
                generic = argumentsTypeClass;
            } else if (isErrorType(argumentsTypeClass)) {
                errorClasses['generic'] = argumentsTypeClass;
            }
        }

        if (ctx.id()) {
            const idTypeClass = new IdVisitor().visit(ctx.id());
            if (isNormalIdType(idTypeClass)) {
                value = idTypeClass;
            } else if (isErrorType(idTypeClass)) {
                errorClasses['value'] = idTypeClass;
            }
        }

        return new TypeNameTypeClass(value, generic, errorClasses);
    }

    getGeneric(): TypeArgumentsTypeClass | null {
        return this.generic;
    }

    isGenericNull(): boolean {
        return this.generic === null;
    }
}

export const isTypeNameType = (target: CommonTypeClass): target is TypeNameTypeClass => {
    return target instanceof TypeNameTypeClass;
};
