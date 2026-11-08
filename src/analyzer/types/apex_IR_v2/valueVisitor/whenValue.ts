import { WhenValueContext } from '@apexdevtools/apex-parser';

import { ValueTypeClass } from '.';

import { WhenLiteralTypeClass, LiteralVisitor, isWhenLiteralType } from '../literalVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { IdTypeClass } from '../idVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

type WhenValueVariant =
    | {
          variant: WhenLiteralTypeClass[] | 'else';
      }
    | {
          variantType: TypeRefTypeClass;
          variant: IdTypeClass;
      };

export type WhenValueType = TypeField<'whenValue'> & WhenValueVariant;

export class WhenValueTypeClass extends ApexCommonTypeClass<'whenValue', WhenValueType> {
    private constructor(whenValueType: WhenValueVariant, sourceSpan: SourceSpan) {
        super('whenValue', whenValueType, sourceSpan);
    }

    static create(ctx: WhenValueContext): WhenValueTypeClass {
        if (ctx.ELSE()) {
            return new WhenValueTypeClass({ variant: 'else' }, getSourceSpan(ctx));
        } else if (ctx.whenLiteral_list() && ctx.whenLiteral_list().length > 0) {
            return new WhenValueTypeClass(
                { variant: ctx.whenLiteral_list().map((w) => WhenLiteralTypeClass.create(w)) },
                getSourceSpan(ctx),
            );
        } else {
            return new WhenValueTypeClass(
                {
                    variantType: TypeRefTypeClass.create(ctx.typeRef()),
                    variant: IdTypeClass.create(ctx.id()),
                },
                getSourceSpan(ctx),
            );
        }
    }
}

export const isWhenValueType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhenValueTypeClass => {
    return isSpicifyApexCommonTypeClass('whenValue', target);
};
