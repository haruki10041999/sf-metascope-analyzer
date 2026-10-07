import { TypeNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { TypeArgumentsTypeClass, ArgumentsVisitor, isTypeArgumentsType } from '../argumentsVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class TypeNameTypeClass extends NameTypeClass<NormalIdTypeClass | 'list' | 'set' | 'map'> {
    private generic: TypeArgumentsTypeClass | ErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | 'list' | 'set' | 'map' | ErrorTypeClass,
        generic: TypeArgumentsTypeClass | ErrorTypeClass | null,
    ) {
        super('typeName', value);
        this.generic = generic;
    }

    static create(ctx: TypeNameContext): TypeNameTypeClass {
        if (!ctx.LIST() && !ctx.SET() && !ctx.MAP() && !ctx.id()) {
            throw new Error('値が異常です。TypeNameContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | 'list' | 'set' | 'map' | ErrorTypeClass;
        if (ctx.LIST() || ctx.SET() || ctx.MAP()) {
            value = ctx.LIST() ? 'list' : ctx.SET() ? 'set' : 'map';
        } else {
            value = isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id');
        }

        // 型引数は `List` 単体やユーザー定義型では省略される
        const generic = ctx.typeArguments()
            ? isValidClass(
                  new ArgumentsVisitor().visit(ctx.typeArguments()),
                  isTypeArgumentsType,
                  'typeArguments',
              )
            : null;

        return new TypeNameTypeClass(value, generic);
    }

    getGeneric(): TypeArgumentsTypeClass | ErrorTypeClass | null {
        return this.generic;
    }
}

export const isTypeNameType = (target: CommonTypeClass): target is TypeNameTypeClass => {
    return target instanceof TypeNameTypeClass;
};
