import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import { TypeDeclarationTypeClass } from '../declarationVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type CompilationUnitType = TypeField<'compilationUnit'> & {
    declaration: TypeDeclarationTypeClass;
};

export class CompilationUnitTypeClass extends ApexCommonTypeClass<
    'compilationUnit',
    CompilationUnitType
> {
    private constructor(fields: FieldsOf<CompilationUnitType>, sourceSpan: SourceSpan) {
        super('compilationUnit', fields, sourceSpan);
    }

    static create(ctx: CompilationUnitContext): CompilationUnitTypeClass {
        return new CompilationUnitTypeClass(
            {
                declaration: createNode(
                    ctx.typeDeclaration(),
                    (c) => TypeDeclarationTypeClass.create(c),
                    'typeDeclaration',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getDeclaration(): CompilationUnitType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isCompilationUnitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CompilationUnitTypeClass => isSpicifyApexCommonTypeClass('compilationUnit', target);
