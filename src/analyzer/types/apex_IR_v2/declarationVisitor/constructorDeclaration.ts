import { ConstructorDeclarationContext } from '@apexdevtools/apex-parser';

import { BlockTypeClass } from '../blockVisitor';
import { QualifiedNameTypeClass } from '../nameVisitor';
import { FormalParametersTypeClass } from '../parameterVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ConstructorDeclarationType = TypeField<'constructorDeclaration'> & {
    name: QualifiedNameTypeClass;
    parameters: FormalParametersTypeClass;
    block: BlockTypeClass;
};

export class ConstructorDeclarationTypeClass extends ApexCommonTypeClass<
    'constructorDeclaration',
    ConstructorDeclarationType
> {
    private constructor(fields: FieldsOf<ConstructorDeclarationType>, sourceSpan: SourceSpan) {
        super('constructorDeclaration', fields, sourceSpan);
    }

    static create(ctx: ConstructorDeclarationContext): ConstructorDeclarationTypeClass {
        return new ConstructorDeclarationTypeClass(
            {
                name: createNode(
                    ctx.qualifiedName(),
                    (c) => QualifiedNameTypeClass.create(c),
                    'qualifiedName',
                ),
                parameters: createNode(
                    ctx.formalParameters(),
                    (c) => FormalParametersTypeClass.create(c),
                    'formalParameters',
                ),
                block: createNode(ctx.block(), (c) => BlockTypeClass.create(c), 'block'),
            },
            getSourceSpan(ctx),
        );
    }

    getName(): ConstructorDeclarationType['name'] {
        return this.getFields().name;
    }

    getParameters(): ConstructorDeclarationType['parameters'] {
        return this.getFields().parameters;
    }

    getBlock(): ConstructorDeclarationType['block'] {
        return this.getFields().block;
    }
}

export const isConstructorDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ConstructorDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('constructorDeclaration', target);
};
