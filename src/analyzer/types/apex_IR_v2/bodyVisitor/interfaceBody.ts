import { InterfaceBodyContext } from '@apexdevtools/apex-parser';

import { InterfaceMethodDeclarationTypeClass } from '../declarationVisitor';
import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type InterfaceBodyType = TypeField<'interfaceBody'> & {
    declaration: InterfaceMethodDeclarationTypeClass[];
};

export class InterfaceBodyTypeClass extends ApexCommonTypeClass<
    'interfaceBody',
    InterfaceBodyType
> {
    private constructor(fields: FieldsOf<InterfaceBodyType>, sourceSpan: SourceSpan) {
        super('interfaceBody', fields, sourceSpan);
    }

    static create(ctx: InterfaceBodyContext): InterfaceBodyTypeClass {
        return new InterfaceBodyTypeClass(
            {
                declaration: createNodeList(
                    ctx.interfaceMethodDeclaration_list(),
                    (c) => InterfaceMethodDeclarationTypeClass.create(c),
                    'interfaceMethodDeclaration',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getDeclaration(): InterfaceBodyType['declaration'] {
        return this.getFields().declaration;
    }
}

export const isInterfaceBodyType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is InterfaceBodyTypeClass => isSpicifyApexCommonTypeClass('interfaceBody', target);
