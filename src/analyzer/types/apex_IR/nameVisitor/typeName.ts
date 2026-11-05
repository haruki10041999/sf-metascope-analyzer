import { TypeNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { TypeArgumentsTypeClass, ArgumentsVisitor, isTypeArgumentsType } from '../argumentsVisitor';
import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';

import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class TypeNameTypeClass extends NameTypeClass<
    'typeName',
    NormalIdTypeClass | 'list' | 'set' | 'map'
> {
    private generic: TypeArgumentsTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | 'list' | 'set' | 'map' | ApexErrorTypeClass,
        generic: TypeArgumentsTypeClass | ApexErrorTypeClass | null,
    ) {
        super('typeName', value);
        this.generic = generic;
    }

    static create(ctx: TypeNameContext): TypeNameTypeClass {
        if (!ctx.LIST() && !ctx.SET() && !ctx.MAP() && !ctx.id()) {
            throw new Error('値が異常です。TypeNameContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | 'list' | 'set' | 'map' | ApexErrorTypeClass;
        if (ctx.LIST() || ctx.SET() || ctx.MAP()) {
            value = ctx.LIST() ? 'list' : ctx.SET() ? 'set' : 'map';
        } else {
            value = visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id');
        }

        // 型引数は `List` 単体やユーザー定義型では省略される
        const generic = visitOptionalNode(
            new ArgumentsVisitor(),
            ctx.typeArguments(),
            isTypeArgumentsType,
            'typeArguments',
        );

        return new TypeNameTypeClass(value, generic);
    }

    getGeneric(): TypeArgumentsTypeClass | ApexErrorTypeClass | null {
        return this.generic;
    }
}

export const isTypeNameType = (
    target: ApexCommonTypeClass<string>,
): target is TypeNameTypeClass => {
    return target instanceof TypeNameTypeClass;
};
