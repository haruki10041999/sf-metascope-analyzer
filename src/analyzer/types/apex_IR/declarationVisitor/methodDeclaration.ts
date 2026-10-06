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
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class MethodDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | 'void' | ErrorTypeClass;
    private param: FormalParametersTypeClass | ErrorTypeClass | null = null;
    private block: NormalBlockTypeClass | ErrorTypeClass;

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | 'void' | ErrorTypeClass,
        param: FormalParametersTypeClass | ErrorTypeClass | null,
        block: NormalBlockTypeClass | ErrorTypeClass,
    ) {
        super('methodDeclaration', value);
        this.valueType = valueType;
        this.param = param;
        this.block = block;
    }

    static create(ctx: MethodDeclarationContext): MethodDeclarationTypeClass {
        if (!ctx.id() || !ctx.block() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。MethodDeclarationContext: ' + ctx.getText());
        }

        return new MethodDeclarationTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            ctx.VOID()
                ? 'void'
                : isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
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

    getValueType(): TypeRefTypeClass | 'void' | ErrorTypeClass {
        return this.valueType;
    }

    getParam(): FormalParametersTypeClass | ErrorTypeClass | null {
        return this.param;
    }

    getBlock(): NormalBlockTypeClass | ErrorTypeClass {
        return this.block;
    }
}

export const isMethodDeclarationType = (
    target: CommonTypeClass,
): target is MethodDeclarationTypeClass => {
    return target instanceof MethodDeclarationTypeClass;
};

