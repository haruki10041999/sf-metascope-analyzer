import { VariableDeclaratorsContext } from '@apexdevtools/apex-parser';

import { VariableDeclaratorTypeClass } from './variableDeclarator';

import {
    ApexCommonTypeClass,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type VariableDeclaratorsType = TypeField<'variableDeclarators'> & {
    element: VariableDeclaratorTypeClass[];
};

export class VariableDeclaratorsTypeClass extends ApexCommonTypeClass<
    'variableDeclarators',
    VariableDeclaratorsType
> {
    private constructor(fields: FieldsOf<VariableDeclaratorsType>, sourceSpan: SourceSpan) {
        super('variableDeclarators', fields, sourceSpan);
    }

    static create(ctx: VariableDeclaratorsContext): VariableDeclaratorsTypeClass {
        return new VariableDeclaratorsTypeClass(
            {
                element: createNodeList(
                    ctx.variableDeclarator_list(),
                    (c) => VariableDeclaratorTypeClass.create(c),
                    'variableDeclarator',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getElement(): VariableDeclaratorsType['element'] {
        return this.getFields().element;
    }
}

export const isVariableDeclaratorsType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclaratorsTypeClass => {
    return isSpicifyApexCommonTypeClass('variableDeclarators', target);
};
