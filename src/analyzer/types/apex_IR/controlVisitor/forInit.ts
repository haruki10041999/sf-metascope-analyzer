import { ForInitContext } from '@apexdevtools/apex-parser';

import { LocalVariableDeclarationTypeClass } from '../declarationVisitor';
import { ExpressionListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ForInitType = TypeField<'forInit'> & {
    value: LocalVariableDeclarationTypeClass | ExpressionListTypeClass;
};

export class ForInitTypeClass extends ApexCommonTypeClass<'forInit', ForInitType> {
    private constructor(fields: FieldsOf<ForInitType>, sourceSpan: SourceSpan) {
        super('forInit', fields, sourceSpan);
    }

    static create(ctx: ForInitContext): ForInitTypeClass {
        if (ctx.localVariableDeclaration()) {
            return new ForInitTypeClass(
                {
                    value: createNode(
                        ctx.localVariableDeclaration(),
                        (c) => LocalVariableDeclarationTypeClass.create(c),
                        'localVariableDeclaration',
                    ),
                },
                getSourceSpan(ctx),
            );
        }
        return new ForInitTypeClass(
            {
                value: createNode(
                    ctx.expressionList(),
                    (c) => ExpressionListTypeClass.create(c),
                    'expressionList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ForInitType['value'] {
        return this.getFields().value;
    }
}

export const isForInitType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ForInitTypeClass => {
    return isSpicifyApexCommonTypeClass('forInit', target);
};
