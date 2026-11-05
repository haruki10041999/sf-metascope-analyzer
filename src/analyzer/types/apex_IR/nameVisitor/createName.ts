import { CreatedNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { IdCreatedNamePairTypeClass, PairVisitor, isIdCreatedNamePairType } from '../pairVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class CreatedNameTypeClass extends NameListTypeClass<
    'createdName',
    IdCreatedNamePairTypeClass
> {
    private constructor(value: (IdCreatedNamePairTypeClass | ApexErrorTypeClass)[]) {
        super('createdName', value);
    }

    static create(ctx: CreatedNameContext): CreatedNameTypeClass {
        if (!ctx.idCreatedNamePair_list()) {
            throw new Error('値が異常です。CreatedNameContext: ' + ctx.getText());
        }

        return new CreatedNameTypeClass(
            visitNodeList(
                new PairVisitor(),
                ctx.idCreatedNamePair_list(),
                isIdCreatedNamePairType,
                'idCreatedNamePair',
            ),
        );
    }
}

export const isCreatedNameType = (
    target: ApexCommonTypeClass<string>,
): target is CreatedNameTypeClass => {
    return target instanceof CreatedNameTypeClass;
};
