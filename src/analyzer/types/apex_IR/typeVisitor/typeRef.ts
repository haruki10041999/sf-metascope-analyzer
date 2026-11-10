import { TypeRefContext } from '@apexdevtools/apex-parser';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeRefType = TypeField<'typeRef'> & {
    /** `a.b.C` の各部分 */
    element: TypeNameTypeClass[];
    dimention: ArraySubscriptsTypeClass;
};

export class TypeRefTypeClass extends ApexCommonTypeClass<'typeRef', TypeRefType> {
    private constructor(fields: FieldsOf<TypeRefType>, sourceSpan: SourceSpan) {
        super('typeRef', fields, sourceSpan);
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        return new TypeRefTypeClass(
            {
                element: createNodeList(
                    ctx.typeName_list(),
                    (c) => TypeNameTypeClass.create(c),
                    'typeName',
                ),
                dimention: createNode(
                    ctx.arraySubscripts(),
                    (c) => ArraySubscriptsTypeClass.create(c),
                    'arraySubscripts',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getElement(): TypeRefType['element'] {
        return this.getFields().element;
    }

    getDimention(): TypeRefType['dimention'] {
        return this.getFields().dimention;
    }
}

export const isTypeRefType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeRefTypeClass => isSpicifyApexCommonTypeClass('typeRef', target);
