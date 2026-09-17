import { Status } from './commons';

export type CommonType = 'Id' | 'String' | 'Double' | 'Integer' | 'Boolean' | 'Date' | 'DateTime';

export type MetadataObject = {
    apiName: string;
    dataType: '__c' | '__mdt' | 'standard';
    fields: MetadataField[];
};

export type MetadataField = {
    apiName: string;
    dataType: '__c' | 'standard';
    type: CommonType;
    referenceObjectApiName?: string;
};

export type Dependency = {
    parentObjectApiName: string;
    parentFieldApiName: string;
    childObjectApiName: string;
};

export type MetadataObjectDiff = Omit<MetadataObject, 'fields'> & {
    fields: MetadataFieldDiff[];
    status: Status;
};

export type MetadataFieldDiff = MetadataField & {
    status: Status;
};

export type DependencyDiff = Dependency & {
    status: Status;
};
