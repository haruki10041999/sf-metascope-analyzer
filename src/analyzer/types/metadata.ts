import { Status } from './commons';

export type MetadataCommonType =
    'Id' | 'String' | 'Double' | 'Integer' | 'Boolean' | 'Date' | 'DateTime';

export type MetadataObject = {
    apiName: string;
    dataType: '__c' | '__mdt' | 'standard';
    fields: MetadataField[];
};

export type MetadataField = {
    apiName: string;
    dataType: '__c' | 'standard';
} & (
    | {
          type: MetadataCommonType;
      }
    | {
          type: 'Lookup' | 'MasterDetail';
          referenceObjectApiName: string;
          relationshipName: string;
      }
);

export type MetadataDependency = {
    parentObjectApiName: string;
    parentFieldApiName: string;
    childObjectApiName: string;
    type: 'Lookup' | 'MasterDetail';
};

export type MetadataObjectDiff = Omit<MetadataObject, 'fields'> & {
    fields: MetadataFieldDiff[];
    status: Status;
};

export type MetadataFieldDiff = MetadataField & {
    status: Status;
};

export type MetadataDependencyDiff = MetadataDependency & {
    status: Status;
};
