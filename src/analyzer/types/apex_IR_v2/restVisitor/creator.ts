import { CreatorContext } from '@apexdevtools/apex-parser';

import { NoRestTypeClass } from './noRest';
import { ClassCreatorRestTypeClass } from './classCreatorRest';
import { ArrayCreatorRestTypeClass } from './arrayCreatorRest';
import { MapCreatorRestTypeClass } from './mapCreatorRest';
import { SetCreatorRestTypeClass } from './setCreatorRest';
import { CreatedNameTypeClass } from '../nameVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

/** creator の後半 (`()`・`[n]`・`{k => v}`・`{a, b}`・`{}`) */
export type CreatorRestTypeClass =
    | NoRestTypeClass
    | ClassCreatorRestTypeClass
    | ArrayCreatorRestTypeClass
    | MapCreatorRestTypeClass
    | SetCreatorRestTypeClass;

export type CreatorType = TypeField<'creator'> & {
    value: CreatedNameTypeClass;
    content: CreatorRestTypeClass;
};

export class CreatorTypeClass extends ApexCommonTypeClass<'creator', CreatorType> {
    private constructor(fields: FieldsOf<CreatorType>, sourceSpan: SourceSpan) {
        super('creator', fields, sourceSpan);
    }

    static create(ctx: CreatorContext): CreatorTypeClass {
        const value = createNode(
            ctx.createdName(),
            (c) => CreatedNameTypeClass.create(c),
            'createdName',
        );

        let content: CreatorType['content'];
        if (ctx.noRest()) {
            content = createNode(ctx.noRest(), (c) => NoRestTypeClass.create(c), 'noRest');
        } else if (ctx.classCreatorRest()) {
            content = createNode(
                ctx.classCreatorRest(),
                (c) => ClassCreatorRestTypeClass.create(c),
                'classCreatorRest',
            );
        } else if (ctx.arrayCreatorRest()) {
            content = createNode(
                ctx.arrayCreatorRest(),
                (c) => ArrayCreatorRestTypeClass.create(c),
                'arrayCreatorRest',
            );
        } else if (ctx.mapCreatorRest()) {
            content = createNode(
                ctx.mapCreatorRest(),
                (c) => MapCreatorRestTypeClass.create(c),
                'mapCreatorRest',
            );
        } else {
            content = createNode(
                ctx.setCreatorRest(),
                (c) => SetCreatorRestTypeClass.create(c),
                'setCreatorRest',
            );
        }

        return new CreatorTypeClass({ value, content }, getSourceSpan(ctx));
    }

    getValue(): CreatorType['value'] {
        return this.getFields().value;
    }

    getContent(): CreatorType['content'] {
        return this.getFields().content;
    }
}

export const isCreatorType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is CreatorTypeClass => isSpicifyApexCommonTypeClass('creator', target);
