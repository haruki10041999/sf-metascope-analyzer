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
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class MethodDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | 'void' | null = null;
    private param: FormalParametersTypeClass | null = null;
    private block: NormalBlockTypeClass | null = null;

    private constructor(
        value: NormalIdTypeClass | null,
        valueType: TypeRefTypeClass | 'void' | null,
        param: FormalParametersTypeClass | null,
        block: NormalBlockTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('methodDeclaration', value, errorClasses);
        this.valueType = valueType;
        this.param = param;
        this.block = block;
    }

    static create(ctx: MethodDeclarationContext): MethodDeclarationTypeClass {
        if (!ctx.id() || !ctx.block() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。MethodDeclarationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let valueType: TypeRefTypeClass | 'void' | null = null;
        let param: FormalParametersTypeClass | null = null;
        let block: NormalBlockTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        const typeTypeClass = new TypeVisitor().visit(ctx.typeRef());
        if (isTypeRefType(typeTypeClass)) {
            valueType = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['valueType'] = typeTypeClass;
        }

        if (ctx.formalParameters()) {
            const parameterTypeClass = new ParameterVisitor().visit(ctx.formalParameters());
            if (isFormalParametersType(parameterTypeClass)) {
                param = parameterTypeClass;
            } else if (isErrorType(parameterTypeClass)) {
                errorClasses['param'] = parameterTypeClass;
            }
        }

        const blockTypeClass = new BlockVisitor().visit(ctx.block());
        if (isNormalBlockType(blockTypeClass)) {
            block = blockTypeClass;
        } else if (isErrorType(blockTypeClass)) {
            errorClasses['block'] = blockTypeClass;
        }

        return new MethodDeclarationTypeClass(value, valueType, param, block, errorClasses);
    }

    getValueType(): TypeRefTypeClass | 'void' | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }

    getParam(): FormalParametersTypeClass | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }

    getBlock(): NormalBlockTypeClass | null {
        return this.block;
    }

    isBlockNull(): boolean {
        return this.block === null;
    }
}

export const isMethodDeclarationType = (
    target: CommonTypeClass,
): target is MethodDeclarationTypeClass => {
    return target instanceof MethodDeclarationTypeClass;
};
