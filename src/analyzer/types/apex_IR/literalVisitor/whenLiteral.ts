import { WhenLiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass, LiteralVisitor } from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

type WhenLiteralValueType = number | string | null | QualifiedNameTypeClass | WhenLiteralTypeClass;

export class WhenLiteralTypeClass extends PrimitiveLiteralTypeClass<WhenLiteralValueType> {
    private operator: string | null = null;

    private constructor(
        value: WhenLiteralValueType | null,
        operator: string | null,
        valueType: string | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('whenLiteral', value, valueType, errorClasses);
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

        let value: WhenLiteralValueType | null = null;
        let operator: string | null = null;
        let valueType: string | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

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
        }

        if (ctx.StringLiteral() || ctx.MultilineStringLiteral()) {
            value = ctx.StringLiteral()
                ? ctx.StringLiteral().getText()
                : ctx.MultilineStringLiteral().getText().split('\n').join('');
            valueType = ctx.StringLiteral() ? 'string' : 'multilineString';
        }

        if (ctx.NULL()) {
            value = null;
            valueType = 'null';
        }

        if (ctx.qualifiedName()) {
            const nameTypeClass = new NameVisitor().visit(ctx.qualifiedName());
            if (isQualifiedNameType(nameTypeClass)) {
                value = nameTypeClass;
                valueType = 'qualifiedName';
            } else if (isErrorType(nameTypeClass)) {
                errorClasses['qualifiedName'] = nameTypeClass;
            }
        }

        if (ctx.whenLiteral()) {
            const literalTypeClass = new LiteralVisitor().visit(ctx.whenLiteral());
            if (isWhenLiteralType(literalTypeClass)) {
                value = literalTypeClass;
                valueType = 'whenLiteral';
            } else if (isErrorType(literalTypeClass)) {
                errorClasses['whenLiteral'] = literalTypeClass;
            }
        }

        return new WhenLiteralTypeClass(value, operator, valueType, errorClasses);
    }

    getOperator(): string | null {
        return this.operator;
    }

    isOperatorNull(): boolean {
        return this.operator === null;
    }
}

export const isWhenLiteralType = (target: CommonTypeClass): target is WhenLiteralTypeClass => {
    return target instanceof WhenLiteralTypeClass;
};
