import { WhenLiteralContext } from '@apexdevtools/apex-parser';

import { PrimitiveLiteralTypeClass, LiteralVisitor } from '.';

import { QualifiedNameTypeClass, NameVisitor, isQualifiedNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

type WhenLiteralValueType = string | QualifiedNameTypeClass;

export class WhenLiteralTypeClass extends PrimitiveLiteralTypeClass<WhenLiteralValueType> {
    private operator: string | null;

    private constructor(
        value: WhenLiteralValueType | ErrorTypeClass,
        operator: string | null,
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
        let operator: string | null = null;
        let valueType: string;
        if (ctx.IntegerLiteral() || ctx.LongLiteral()) {
            value = ctx.IntegerLiteral()
                ? ctx.IntegerLiteral().getText()
                : ctx.LongLiteral().getText();
            valueType = ctx.IntegerLiteral() ? 'integer' : 'long';

            // 符号は複数並び得るため、ソース順のまま連結する
            operator = [...ctx.ADD_list(), ...ctx.SUB_list()]
                .sort((a, b) => a.symbol.tokenIndex - b.symbol.tokenIndex)
                .map((node) => node.getText())
                .join('');
        } else if (ctx.StringLiteral() || ctx.MultilineStringLiteral()) {
            value = ctx.StringLiteral()
                ? ctx.StringLiteral().getText()
                : ctx.MultilineStringLiteral().getText();
            valueType = ctx.StringLiteral() ? 'string' : 'multilineString';
        } else if (ctx.qualifiedName()) {
            value = isValidClass(
                new NameVisitor().visit(ctx.qualifiedName()),
                isQualifiedNameType,
                'qualifiedName',
            );
            valueType = 'qualifiedName';
        } else if (ctx.whenLiteral()) {
            const valueTypeClass = isValidClass(
                new LiteralVisitor().visit(ctx.whenLiteral()),
                isWhenLiteralType,
                'whenLiteral',
            );

            if (isWhenLiteralType(valueTypeClass)) {
                value = valueTypeClass.getValue();
                valueType = valueTypeClass.getValueType() ?? '';
            } else {
                throw new Error('値が異常です。WhenLiteralContext: ' + ctx.getText());
            }
        } else {
            value = ctx.NULL().getText();
            valueType = 'null';
        }

        return new WhenLiteralTypeClass(value, operator, valueType);
    }

    getOperator(): string | null {
        return this.operator;
    }
}

export const isWhenLiteralType = (target: CommonTypeClass): target is WhenLiteralTypeClass => {
    return target instanceof WhenLiteralTypeClass;
};
