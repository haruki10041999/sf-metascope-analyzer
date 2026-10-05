import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { IdCreatedNamePairTypeClass, PairVisitor, isIdCreatedNamePairType } from '../pairVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class CreatedNameTypeClass extends NameListTypeClass<IdCreatedNamePairTypeClass> {
    private constructor(value: (IdCreatedNamePairTypeClass | ErrorTypeClass)[]) {
        super('createdName', value);
    }

    static create(ctx: CreatedNameContext): CreatedNameTypeClass {
        if (!ctx.idCreatedNamePair_list()) {
            throw new Error('値が異常です。CreatedNameContext: ' + ctx.getText());
        }

        return new CreatedNameTypeClass(
            isValidClassList(
                ctx.idCreatedNamePair_list(),
                (ctx) => new PairVisitor().visit(ctx),
                isIdCreatedNamePairType,
                'idCreatedNamePair',
            ),
        );
    }
}

export const isCreatedNameType = (target: CommonTypeClass): target is CreatedNameTypeClass => {
    return target instanceof CreatedNameTypeClass;
};
