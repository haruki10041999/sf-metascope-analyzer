import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import { UnitTypeClass } from '../unitVisitor';

import {
    TypeDeclarationTypeClass,
    DeclarationVisitor,
    isTypeDeclarationType,
} from '../declarationVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class CompilationUnitTypeClass extends UnitTypeClass<TypeDeclarationTypeClass> {
    private constructor(value: TypeDeclarationTypeClass | ErrorTypeClass) {
        super('compilationUnit', value);
    }

    static create(ctx: CompilationUnitContext): CompilationUnitTypeClass {
        if (!ctx.typeDeclaration()) {
            throw new Error('値が異常です。CompilationUnitContext: ' + ctx.getText());
        }

        return new CompilationUnitTypeClass(
            isValidClass(
                new DeclarationVisitor().visit(ctx.typeDeclaration()),
                isTypeDeclarationType,
                'typeDeclaration',
            ),
        );
    }
}

export const isCompilationUnitType = (
    target: CommonTypeClass,
): target is CompilationUnitTypeClass => {
    return target instanceof CompilationUnitTypeClass;
};

