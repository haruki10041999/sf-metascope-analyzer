import { ClassBodyContext } from '@apexdevtools/apex-parser';

import {
    ClassBodyDeclarationTypeClass,
    DeclarationVisitor,
    isClassBodyDeclarationType,
} from '../declarationVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ClassBodyType = TypeField<'classBody'> & {
    declaration: ClassBodyDeclarationTypeClass[];
};

export class ClassBodyTypeClass extends ApexCommonTypeClass<'classBody', ClassBodyType> {
    private constructor(declaration: ClassBodyDeclarationTypeClass[], sourceSpan: SourceSpan) {
        super('classBody', { declaration: declaration }, sourceSpan);
    }

    static create(ctx: ClassBodyContext): ClassBodyTypeClass {
        return new ClassBodyTypeClass(
            ctx.classBodyDeclaration_list().map((d) => ClassBodyDeclarationTypeClass.create(d)),
            getSourceSpan(ctx),
        );
    }
}

export const isClassBodyType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ClassBodyTypeClass => {
    return isSpicifyApexCommonTypeClass('classBody', target);
};
