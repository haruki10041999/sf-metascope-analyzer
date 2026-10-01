import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { IdCreatedNamePairTypeClass, PairVisitor, isIdCreatedNamePairType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class CreatedNameTypeClass extends NameTypeClass<IdCreatedNamePairTypeClass[]> {
    private constructor(
        value: IdCreatedNamePairTypeClass[] | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('createdName', value, errorClasses);
    }

    static create(ctx: CreatedNameContext): CreatedNameTypeClass {
        if (!ctx.idCreatedNamePair_list()) {
            throw new Error('値が異常です。CreatedNameContext: ' + ctx.getText());
        }

        const value: IdCreatedNamePairTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.idCreatedNamePair_list().forEach((idCreatedNamePairCtx, index) => {
            const pairTypeClass = new PairVisitor().visit(idCreatedNamePairCtx);
            if (isIdCreatedNamePairType(pairTypeClass)) {
                value.push(pairTypeClass);
            } else if (isErrorType(pairTypeClass)) {
                errorClasses[`value_${index}`] = pairTypeClass;
            }
        });

        return new CreatedNameTypeClass(value, errorClasses);
    }
}

export const isCreatedNameType = (target: CommonTypeClass): target is CreatedNameTypeClass => {
    return target instanceof CreatedNameTypeClass;
};
