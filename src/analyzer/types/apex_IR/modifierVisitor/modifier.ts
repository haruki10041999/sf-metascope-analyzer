import { ModifierContext } from '@apexdevtools/apex-parser';

import { AnnotationTypeClass } from './annotation';

import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ModifierKeyword =
    | 'GLOBAL'
    | 'PUBLIC'
    | 'PROTECTED'
    | 'PRIVATE'
    | 'TRANSIENT'
    | 'STATIC'
    | 'ABSTRACT'
    | 'FINAL'
    | 'WEBSERVICE'
    | 'OVERRIDE'
    | 'VIRTUAL'
    | 'TESTMETHOD'
    | 'WITH_SHARING'
    | 'WITHOUT_SHARING'
    | 'INHERITED_SHARING';

/** 修飾子 1 つ。キーワードの修飾子 (keyword) か、アノテーション (annotation) */
export type ModifierType = TypeField<'modifier'> &
    (
        | { kind: 'keyword'; keyword: ModifierKeyword }
        | { kind: 'annotation'; annotation: AnnotationTypeClass }
    );

export class ModifierTypeClass extends ApexCommonTypeClass<'modifier', ModifierType> {
    private constructor(fields: FieldsOf<ModifierType>, sourceSpan: SourceSpan) {
        super('modifier', fields, sourceSpan);
    }

    static create(ctx: ModifierContext): ModifierTypeClass {
        const keyword = ModifierTypeClass.keywordOf(ctx);
        return new ModifierTypeClass(
            keyword
                ? { kind: 'keyword', keyword }
                : {
                      kind: 'annotation',
                      annotation: createNode(
                          ctx.annotation(),
                          (c) => AnnotationTypeClass.create(c),
                          'annotation',
                      ),
                  },
            getSourceSpan(ctx),
        );
    }

    /** キーワードの修飾子なら、その名前。アノテーションなら null */
    private static keywordOf(ctx: ModifierContext): ModifierKeyword | null {
        let value: ModifierKeyword | null;
        if (ctx.GLOBAL()) {
            value = 'GLOBAL';
        } else if (ctx.PUBLIC()) {
            value = 'PUBLIC';
        } else if (ctx.PROTECTED()) {
            value = 'PROTECTED';
        } else if (ctx.PRIVATE()) {
            value = 'PRIVATE';
        } else if (ctx.TRANSIENT()) {
            value = 'TRANSIENT';
        } else if (ctx.STATIC()) {
            value = 'STATIC';
        } else if (ctx.ABSTRACT()) {
            value = 'ABSTRACT';
        } else if (ctx.FINAL()) {
            value = 'FINAL';
        } else if (ctx.WEBSERVICE()) {
            value = 'WEBSERVICE';
        } else if (ctx.OVERRIDE()) {
            value = 'OVERRIDE';
        } else if (ctx.VIRTUAL()) {
            value = 'VIRTUAL';
        } else if (ctx.TESTMETHOD()) {
            value = 'TESTMETHOD';
        } else if (ctx.WITH() && ctx.SHARING()) {
            value = 'WITH_SHARING';
        } else if (ctx.WITHOUT() && ctx.SHARING()) {
            value = 'WITHOUT_SHARING';
        } else if (ctx.INHERITED() && ctx.SHARING()) {
            value = 'INHERITED_SHARING';
        } else {
            value = null;
        }
        return value;
    }

    getKind(): ModifierType['kind'] {
        return this.getFields().kind;
    }
}

export const isModifierType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ModifierTypeClass => {
    return isSpicifyApexCommonTypeClass('modifier', target);
};
