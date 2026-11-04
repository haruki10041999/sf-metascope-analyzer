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
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClass } from '../commonVisitor';

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
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            ctx.VOID()
                ? 'void'
                : isApexValidClass(
                      new TypeVisitor().visit(ctx.typeRef()),
                      isTypeRefType,
                      'typeRef',
                  ),
            ctx.formalParameters()
                ? isApexValidClass(
                      new ParameterVisitor().visit(ctx.formalParameters()),
                      isFormalParametersType,
                      'formalParameters',
                  )
                : null,
            // abstract メソッドは本体を持たない（`void run();`）
            ctx.block()
                ? isApexValidClass(
                      new BlockVisitor().visit(ctx.block()),
                      isNormalBlockType,
                      'block',
                  )
                : null,
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

