import { StatementJson, ErrorJson } from '../../../types';

export type StatementDiff =
    | {
          status: 'added' | 'deleted';
          statement: StatementJson | ErrorJson;
      }
      | {
        status:'unchanged' | 'changed';
        before: StatementJson | ErrorJson;
        after: StatementJson | ErrorJson;
      };

const _flatStatement = (
    target: StatementJson | ErrorJson)[],
    result: (StatementJson | ErrorJson)[]
):void => {

};


export const makeStatementDiff = (
    before: (StatementJson | ErrorJson)[],
    after: (StatementJson | ErrorJson)[],
): StatementDiff[] => {
    
};
