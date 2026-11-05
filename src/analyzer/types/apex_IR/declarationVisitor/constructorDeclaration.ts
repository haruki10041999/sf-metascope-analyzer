import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import {
    FormalParametersTypeClass,
    ParameterVisitor,
    isFormalParametersType,
} from '../parameterVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

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
            visitNode(new NameVisitor(), ctx.qualifiedName(), isQualifiedNameType, 'qualifiedName'),
            visitOptionalNode(
                new ParameterVisitor(),
                ctx.formalParameters(),
                isFormalParametersType,
                'formalParameters',
            ),
            visitNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
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
