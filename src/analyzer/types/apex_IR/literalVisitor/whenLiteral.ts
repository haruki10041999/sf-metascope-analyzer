import { WhenLiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass, LiteralVisitor } from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type WhenLiteralValueType = number | string | null | QualifiedNameTypeClass | WhenLiteralTypeClass;

export class WhenLiteralTypeClass extends PrimitiveLiteralTypeClass<WhenLiteralValueType> {
    private operator: string;

    private constructor(
        value: WhenLiteralValueType | ErrorTypeClass,
        operator: string,
        valueType: string,
    ) {
        super('whenLiteral', value, valueType);
        this.operator = operator;
    }

    static create(ctx: WhenLiteralContext): WhenLiteralTypeClass {
        if (
            !ctx.IntegerLiteral() &&
            !ctx.LongLiteral() &&
            !ctx.StringLiteral() &&
            !ctx.MultilineStringLiteral() &&
            !ctx.NULL() &&
            !ctx.qualifiedName() &&
            !ctx.whenLiteral()
        ) {
            throw new Error('値が異常です。WhenLiteralContext: ' + ctx.getText());
        }

        let value: WhenLiteralValueType | ErrorTypeClass;
        let operator: string = '';
        let valueType: string = '';

        if (ctx.IntegerLiteral() || ctx.LongLiteral()) {
            value = ctx.IntegerLiteral()
                ? parseInt(ctx.IntegerLiteral().getText(), 10)
                : parseInt(ctx.LongLiteral().getText(), 10);

            valueType = ctx.IntegerLiteral() ? 'integer' : 'long';

            if (ctx.ADD_list() && ctx.ADD_list().length > 0) {
                operator = ctx
                    .ADD_list()
                    .map((node) => node.getText())
                    .join('');
            }

            if (ctx.SUB_list() && ctx.SUB_list().length > 0) {
                operator = ctx
                    .SUB_list()
                    .map((node) => node.getText())
                    .join('');
            }
        } else if (ctx.StringLiteral() || ctx.MultilineStringLiteral()) {
            value = ctx.StringLiteral()
                ? ctx.StringLiteral().getText()
                : ctx.MultilineStringLiteral().getText().split('\n').join('');
            valueType = ctx.StringLiteral() ? 'string' : 'multilineString';
        } else if (ctx.qualifiedName()) {
            value = isValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            );
            valueType = 'qualifiedName';
        } else if (ctx.whenLiteral()) {
            value = isValidClass(
                new LiteralVisitor().visitWhenLiteral(ctx.whenLiteral()),
                isWhenLiteralType,
                'whenLiteral',
            );
            valueType = 'whenLiteral';
        } else {
            value = null;
            valueType = 'null';
        }

        return new WhenLiteralTypeClass(value, operator, valueType);
    }

    getOperator(): string {
        return this.operator;
    }
}

export const isWhenLiteralType = (target: CommonTypeClass): target is WhenLiteralTypeClass => {
    return target instanceof WhenLiteralTypeClass;
};
