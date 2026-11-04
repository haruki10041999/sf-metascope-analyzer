import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ClassBodyTypeClass, BodyVisitor, isClassBodyType } from '../bodyVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ClassDeclarationTypeClass extends DeclarationTypeClass<
    'classDeclaration',
    NormalIdTypeClass
> {
    private body: ClassBodyTypeClass | ApexErrorTypeClass;
    private extend: TypeRefTypeClass | ApexErrorTypeClass | null;
    private implement: TypeListTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        body: ClassBodyTypeClass | ApexErrorTypeClass,
        extend: TypeRefTypeClass | ApexErrorTypeClass | null,
        implement: TypeListTypeClass | ApexErrorTypeClass | null,
    ) {
        super('classDeclaration', value);
        this.body = body;
        this.extend = extend;
        this.implement = implement;
    }

    static create(ctx: ClassDeclarationContext): ClassDeclarationTypeClass {
        if (!ctx.id() || !ctx.classBody()) {
            throw new Error('値が異常です。ClassDeclarationContext: ' + ctx.getText());
        }

        return new ClassDeclarationTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isApexValidClass(
                new BodyVisitor().visit(ctx.classBody()),
                isClassBodyType,
                'classBody',
            ),
            ctx.EXTENDS() && ctx.typeRef()
                ? isApexValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef')
                : null,
            ctx.IMPLEMENTS() && ctx.typeList()
                ? isApexValidClass(
                      new ListVisitor().visit(ctx.typeList()),
                      isTypeListType,
                      'typeList',
                  )
                : null,
        );
    }

    getBody(): ClassBodyTypeClass | ApexErrorTypeClass {
        return this.body;
    }

    getExtend(): TypeRefTypeClass | ApexErrorTypeClass | null {
        return this.extend;
    }

    getImplement(): TypeListTypeClass | ApexErrorTypeClass | null {
        return this.implement;
    }
}

export const isClassDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is ClassDeclarationTypeClass => {
    return target instanceof ClassDeclarationTypeClass;
};
