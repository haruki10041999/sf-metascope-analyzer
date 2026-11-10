import { ClassBodyContext } from '@apexdevtools/apex-parser';

import { ClassBodyDeclarationTypeClass } from '../declarationVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ClassBodyType = TypeField<'classBody'> & {
    declaration: ClassBodyDeclarationTypeClass[];
};

export class ClassBodyTypeClass extends ApexCommonTypeClass<'classBody', ClassBodyType> {
    private constructor(fields: FieldsOf<ClassBodyType>, sourceSpan: SourceSpan) {
        super('classBody', fields, sourceSpan);
    }

    static create(ctx: ClassBodyContext): ClassBodyTypeClass {
        return new ClassBodyTypeClass(
            {
                declaration: createNodeList(
                    ctx.classBodyDeclaration_list(),
                    (c) => ClassBodyDeclarationTypeClass.create(c),
                    'classBodyDeclaration',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getDeclaration(): ClassBodyType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isClassBodyType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ClassBodyTypeClass => isSpicifyApexCommonTypeClass('classBody', target);
