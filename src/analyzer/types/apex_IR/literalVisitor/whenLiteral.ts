import { WhenLiteralContext } from '@apexdevtools/apex-parser';

import { QualifiedNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** 種類ごとに値の形が決まる。符号 (signs) があるのは integer・long のときだけ */
export type WhenLiteralType = TypeField<'whenLiteral'> &
    (
        | {
              kind: 'integer' | 'long';
              value: string;
              /** 前に付いた符号 (ソース順。なければ空の配列) */
              signs: ('+' | '-')[];
          }
        | { kind: 'string' | 'longText'; value: string }
        | { kind: 'null' }
        | { kind: 'id'; value: QualifiedNameTypeClass }
    );

/** フィールドから type を除く (括弧を外したときに中身をそのまま使う) */
const withoutType = (fields: WhenLiteralType): FieldsOf<WhenLiteralType> => {
    switch (fields.kind) {
        case 'integer':
        case 'long':
            return { kind: fields.kind, value: fields.value, signs: fields.signs };
        case 'string':
        case 'longText':
            return { kind: fields.kind, value: fields.value };
        case 'null':
            return { kind: 'null' };
        case 'id':
            return { kind: 'id', value: fields.value };
    }
};

export class WhenLiteralTypeClass extends ApexCommonTypeClass<'whenLiteral', WhenLiteralType> {
    private constructor(fields: FieldsOf<WhenLiteralType>, sourceSpan: SourceSpan) {
        super('whenLiteral', fields, sourceSpan);
    }

    static create(ctx: WhenLiteralContext): WhenLiteralTypeClass {
        return new WhenLiteralTypeClass(WhenLiteralTypeClass.createFields(ctx), getSourceSpan(ctx));
    }

    private static createFields(ctx: WhenLiteralContext): FieldsOf<WhenLiteralType> {
        if (ctx.IntegerLiteral() || ctx.LongLiteral()) {
            // 符号は複数並び得るため、ソース順に並べる
            const signs = [...ctx.ADD_list(), ...ctx.SUB_list()]
                .sort((a, b) => a.symbol.tokenIndex - b.symbol.tokenIndex)
                .map((s): '+' | '-' => (s.getText() === '-' ? '-' : '+'));
            return ctx.IntegerLiteral()
                ? { kind: 'integer', value: ctx.IntegerLiteral().getText(), signs }
                : { kind: 'long', value: ctx.LongLiteral().getText(), signs };
        } else if (ctx.StringLiteral()) {
            return { kind: 'string', value: ctx.StringLiteral().getText() };
        } else if (ctx.MultilineStringLiteral()) {
            return { kind: 'longText', value: ctx.MultilineStringLiteral().getText() };
        } else if (ctx.NULL()) {
            return { kind: 'null' };
        } else if (ctx.qualifiedName()) {
            return {
                kind: 'id',
                value: createNode(
                    ctx.qualifiedName(),
                    (c) => QualifiedNameTypeClass.create(c),
                    'qualifiedName',
                ),
            };
        } else if (ctx.whenLiteral()) {
            // `(whenLiteral)` は括弧を外して中身の値を持つ。中身が壊れていれば例外にし、呼び出し元の
            // createNode でこのノードごとエラーにする
            return withoutType(WhenLiteralTypeClass.create(ctx.whenLiteral()).getFields());
        }

        throw new Error('値が異常です。WhenLiteralContext: ' + ctx.getText());
    }

    getKind(): WhenLiteralType['kind'] {
        return this.getFields().kind;
    }
}

export const isWhenLiteralType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhenLiteralTypeClass => isSpicifyApexCommonTypeClass('whenLiteral', target);
