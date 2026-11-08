import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import {
    TypeDeclarationTypeClass,
    DeclarationVisitor,
    isTypeDeclarationType,
} from '../declarationVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CompilationUnitType = TypeField<'compilationUnit'> & {
    declaration: TypeDeclarationTypeClass;
};

export class CompilationUnitTypeClass extends ApexCommonTypeClass<
    'compilationUnit',
    CompilationUnitType
> {
    private constructor(declaration: TypeDeclarationTypeClass, sourceSpan: SourceSpan) {
        super('compilationUnit', { declaration: declaration }, sourceSpan);
    }

    static create(ctx: CompilationUnitContext): CompilationUnitTypeClass {
        return new CompilationUnitTypeClass(
            TypeDeclarationTypeClass.create(ctx.typeDeclaration()),
            getSourceSpan(ctx),
        );
    }
}

export const isCompilationUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CompilationUnitTypeClass => {
    return isSpicifyApexCommonTypeClass('compilationUnit', target);
};
