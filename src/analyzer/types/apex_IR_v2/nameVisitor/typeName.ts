import { TypeNameContext } from '@apexdevtools/apex-parser';

import { TypeArgumentsTypeClass } from '../argumentsVisitor';
import { IdTypeClass } from '../idVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 組み込みのコレクションの型 (collection) とユーザーの型の名前 (named) */
export type TypeNameType = TypeField<'typeName'> & {
    /** 型引数。`List` 単体やユーザー定義型では省略される */
    generic: TypeArgumentsTypeClass | null;
} & (
        | { kind: 'collection'; collection: 'list' | 'set' | 'map' }
        | { kind: 'named'; name: IdTypeClass }
    );

export class TypeNameTypeClass extends ApexCommonTypeClass<'typeName', TypeNameType> {
    private constructor(fields: FieldsOf<TypeNameType>, sourceSpan: SourceSpan) {
        super('typeName', fields, sourceSpan);
    }

    static create(ctx: TypeNameContext): TypeNameTypeClass {
        const generic = createOptionalNode(
            ctx.typeArguments(),
            (c) => TypeArgumentsTypeClass.create(c),
            'typeArguments',
        );
        const collection = ctx.LIST() ? 'list' : ctx.SET() ? 'set' : ctx.MAP() ? 'map' : null;

        return new TypeNameTypeClass(
            collection
                ? { kind: 'collection', collection, generic }
                : {
                      kind: 'named',
                      name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                      generic,
                  },
            getSourceSpan(ctx),
        );
    }

    getKind(): TypeNameType['kind'] {
        return this.getFields().kind;
    }

    getGeneric(): TypeNameType['generic'] {
        return this.getFields().generic;
    }
}

export const isTypeNameType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeNameTypeClass => isSpicifyApexCommonTypeClass('typeName', target);
