import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    FormalParametersTypeClass,
    ParameterVisitor,
    isFormalParametersType,
} from '../parameterVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class ConstructorDeclarationTypeClass extends DeclarationTypeClass<QualifiedNameTypeClass> {
    private param: FormalParametersTypeClass | ErrorTypeClass | null = null;
    private block: NormalBlockTypeClass | ErrorTypeClass;

    private constructor(
        value: QualifiedNameTypeClass | ErrorTypeClass,
        param: FormalParametersTypeClass | ErrorTypeClass | null,
        block: NormalBlockTypeClass | ErrorTypeClass,
    ) {
        super('constructorDeclaration', value);
        this.param = param;
        this.block = block;
    }

    static create(ctx: ConstructorDeclarationContext): ConstructorDeclarationTypeClass {
        if (!ctx.qualifiedName() || !ctx.block()) {
            throw new Error('値が異常です。ConstructorDeclarationContext: ' + ctx.getText());
        }

        return new ConstructorDeclarationTypeClass(
            isValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            ),
            ctx.formalParameters()
                ? isValidClass(
                      new ParameterVisitor().visit(ctx.formalParameters()),
                      isFormalParametersType,
                      'formalParameters',
                  )
                : null,
            isValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getParam(): FormalParametersTypeClass | ErrorTypeClass | null {
        return this.param;
    }

    getBlock(): NormalBlockTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isConstructorDeclarationType = (
    target: CommonTypeClass,
): target is ConstructorDeclarationTypeClass => {
    return target instanceof ConstructorDeclarationTypeClass;
};
