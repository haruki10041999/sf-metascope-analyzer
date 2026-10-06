import { ClassDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ClassBodyTypeClass, BodyVisitor, isClassBodyType } from '../bodyVisitor';
import { TypeListTypeClass, ListVisitor, isTypeListType } from '../listVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ClassDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private body: ClassBodyTypeClass | ErrorTypeClass;
    private extend: TypeRefTypeClass | ErrorTypeClass | null;
    private implement: TypeListTypeClass | ErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        body: ClassBodyTypeClass | ErrorTypeClass,
        extend: TypeRefTypeClass | ErrorTypeClass | null,
        implement: TypeListTypeClass | ErrorTypeClass | null,
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new BodyVisitor().visit(ctx.classBody()), isClassBodyType, 'classBody'),
            ctx.EXTENDS() && ctx.typeRef()
                ? isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef')
                : null,
            ctx.IMPLEMENTS() && ctx.typeList()
                ? isValidClass(new ListVisitor().visit(ctx.typeList()), isTypeListType, 'typeList')
                : null,
        );
    }

    getBody(): ClassBodyTypeClass | ErrorTypeClass {
        return this.body;
    }

    getExtend(): TypeRefTypeClass | ErrorTypeClass | null {
        return this.extend;
    }

    getImplement(): TypeListTypeClass | ErrorTypeClass | null {
        return this.implement;
    }
}

export const isClassDeclarationType = (
    target: CommonTypeClass,
): target is ClassDeclarationTypeClass => {
    return target instanceof ClassDeclarationTypeClass;
};
