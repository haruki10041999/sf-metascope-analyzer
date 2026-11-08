import { MethodDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalBlockTypeClass, BlockVisitor, isNormalBlockType } from '../blockVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
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

export class MethodDeclarationTypeClass extends DeclarationTypeClass<
    'methodDeclaration',
    NormalIdTypeClass
> {
    private valueType: TypeRefTypeClass | 'void' | ApexErrorTypeClass;
    private param: FormalParametersTypeClass | ApexErrorTypeClass | null = null;
    private block: NormalBlockTypeClass | ApexErrorTypeClass | null;

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | 'void' | ApexErrorTypeClass,
        param: FormalParametersTypeClass | ApexErrorTypeClass | null,
        block: NormalBlockTypeClass | ApexErrorTypeClass | null,
    ) {
        super('methodDeclaration', value);
        this.valueType = valueType;
        this.param = param;
        this.block = block;
    }

    static create(ctx: MethodDeclarationContext): MethodDeclarationTypeClass {
        if (!ctx.id() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。MethodDeclarationContext: ' + ctx.getText());
        }

        return new MethodDeclarationTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            ctx.VOID()
                ? 'void'
                : visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
            visitOptionalNode(
                new ParameterVisitor(),
                ctx.formalParameters(),
                isFormalParametersType,
                'formalParameters',
            ),
            // abstract メソッドは本体を持たない（`void run();`）
            visitOptionalNode(new BlockVisitor(), ctx.block(), isNormalBlockType, 'block'),
        );
    }

    getValueType(): TypeRefTypeClass | 'void' | ApexErrorTypeClass {
        return this.valueType;
    }

    getParam(): FormalParametersTypeClass | ApexErrorTypeClass | null {
        return this.param;
    }

    getBlock(): NormalBlockTypeClass | ApexErrorTypeClass | null {
        return this.block;
    }
}

export const isMethodDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is MethodDeclarationTypeClass => {
    return target instanceof MethodDeclarationTypeClass;
};
