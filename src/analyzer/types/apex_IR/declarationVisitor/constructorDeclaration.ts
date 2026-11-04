import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    FormalParametersTypeClass,
    ParameterVisitor,
    isFormalParametersType,
} from '../parameterVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

export class ConstructorDeclarationTypeClass extends DeclarationTypeClass<
    'constructorDeclaration',
    QualifiedNameTypeClass
> {
    private param: FormalParametersTypeClass | ApexErrorTypeClass | null = null;
    private block: NormalBlockTypeClass | ApexErrorTypeClass;

    private constructor(
        value: QualifiedNameTypeClass | ApexErrorTypeClass,
        param: FormalParametersTypeClass | ApexErrorTypeClass | null,
        block: NormalBlockTypeClass | ApexErrorTypeClass,
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
            isApexValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            ),
            ctx.formalParameters()
                ? isApexValidClass(
                      new ParameterVisitor().visit(ctx.formalParameters()),
                      isFormalParametersType,
                      'formalParameters',
                  )
                : null,
            isApexValidClass(new BlockVisitor().visit(ctx.block()), isNormalBlockType, 'block'),
        );
    }

    getParam(): FormalParametersTypeClass | ApexErrorTypeClass | null {
        return this.param;
    }

    getBlock(): NormalBlockTypeClass | ApexErrorTypeClass {
        return this.block;
    }
}

export const isConstructorDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is ConstructorDeclarationTypeClass => {
    return target instanceof ConstructorDeclarationTypeClass;
};
