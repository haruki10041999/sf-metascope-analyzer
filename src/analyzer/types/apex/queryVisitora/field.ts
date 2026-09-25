import { FieldNameContext, SoqlIdContext } from '@apexdevtools/apex-parser';

export type ReferenceObject = {
    order: number;
    refrenceApiName: string;
};

export type SoqlField =
    | {
          type: 'primitive';
          apiName: string;
      }
    | {
          type: 'reference';
          apiName: string;
          referenceObjects: ReferenceObject[];
      };

export const makeSoqlField = (ctx: FieldNameContext): SoqlField => {
    const fieldNamesList: SoqlIdContext[] = ctx.soqlId_list();

    if (fieldNamesList.length === 0) {
        throw new Error(`値が異常です,FieldNameContext：${ctx.getText()}`);
    }

    if (fieldNamesList.length === 1) {
        return {
            type: 'primitive',
            apiName: fieldNamesList.at(-1)!.getText(),
        };
    }

    const apiName = fieldNamesList.at(-1)!.getText();

    const referenceObjects = fieldNamesList
        .slice(0, -1)
        .map((fieldName: SoqlIdContext, index: number) => ({
            order: index + 1,
            refrenceApiName: fieldName.getText(),
        }));

    return {
        type: 'reference',
        apiName,
        referenceObjects,
    };
};
