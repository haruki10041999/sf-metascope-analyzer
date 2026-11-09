import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ClassBodyTypeClass } from '../bodyVisitor';
import { TypeListTypeClass } from '../listVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ClassDeclarationType = TypeField<'classDeclaration'> & {
    name: IdTypeClass;
    extend: TypeRefTypeClass | null;
    implement: TypeListTypeClass | null;
    body: ClassBodyTypeClass;
};

export class ClassDeclarationTypeClass extends ApexCommonTypeClass<
    'classDeclaration',
    ClassDeclarationType
> {
    private constructor(fields: FieldsOf<ClassDeclarationType>, sourceSpan: SourceSpan) {
        super('classDeclaration', fields, sourceSpan);
    }

    static create(ctx: ClassDeclarationContext): ClassDeclarationTypeClass {
        return new ClassDeclarationTypeClass(
            {
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                extend: ctx.EXTENDS()
                    ? createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef')
                    : null,
                implement: ctx.IMPLEMENTS()
                    ? createNode(ctx.typeList(), (c) => TypeListTypeClass.create(c), 'typeList')
                    : null,
                body: createNode(ctx.classBody(), (c) => ClassBodyTypeClass.create(c), 'classBody'),
            },
            getSourceSpan(ctx),
        );
    }

    getName(): ClassDeclarationType['name'] {
        return this.getFields().name;
    }

    getExtend(): ClassDeclarationType['extend'] {
        return this.getFields().extend;
    }

    getImplement(): ClassDeclarationType['implement'] {
        return this.getFields().implement;
    }

    getBody(): ClassDeclarationType['body'] {
        return this.getFields().body;
    }
}

export const isClassDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ClassDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('classDeclaration', target);
};
