import { CompilationUnitContext } from '@apexdevtools/apex-parser';

import { UnitTypeClass } from '../unitVisitor';

import {
    TypeDeclarationTypeClass,
    DeclarationVisitor,
    isTypeDeclarationType,
} from '../declarationVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class CompilationUnitTypeClass extends UnitTypeClass<
    'compilationUnit',
    TypeDeclarationTypeClass
> {
    private constructor(value: TypeDeclarationTypeClass | ApexErrorTypeClass) {
        super('compilationUnit', value);
    }

    static create(ctx: CompilationUnitContext): CompilationUnitTypeClass {
        if (!ctx.typeDeclaration()) {
            throw new Error('値が異常です。CompilationUnitContext: ' + ctx.getText());
        }

        return new CompilationUnitTypeClass(
            visitNode(
                new DeclarationVisitor(),
                ctx.typeDeclaration(),
                isTypeDeclarationType,
                'typeDeclaration',
            ),
        );
    }
}

export const isCompilationUnitType = (
    target: ApexCommonTypeClass<string>,
): target is CompilationUnitTypeClass => {
    return target instanceof CompilationUnitTypeClass;
};
