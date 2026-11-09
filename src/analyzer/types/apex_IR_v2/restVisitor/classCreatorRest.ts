import { ClassCreatorRestContext } from '@apexdevtools/apex-parser';

import { ArgumentsTypeClass } from '../argumentsVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ClassCreatorRestType = TypeField<'classCreatorRest'> & {
    value: ArgumentsTypeClass;
};

export class ClassCreatorRestTypeClass extends ApexCommonTypeClass<
    'classCreatorRest',
    ClassCreatorRestType
> {
    private constructor(fields: FieldsOf<ClassCreatorRestType>, sourceSpan: SourceSpan) {
        super('classCreatorRest', fields, sourceSpan);
    }

    static create(ctx: ClassCreatorRestContext): ClassCreatorRestTypeClass {
        return new ClassCreatorRestTypeClass(
            {
                value: createNode(
                    ctx.arguments(),
                    (c) => ArgumentsTypeClass.create(c),
                    'arguments',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ClassCreatorRestType['value'] {
        return this.getFields().value;
    }
}

export const isClassCreatorRestType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ClassCreatorRestTypeClass => isSpicifyApexCommonTypeClass('classCreatorRest', target);
