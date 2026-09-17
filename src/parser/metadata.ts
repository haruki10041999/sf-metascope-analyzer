import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

import { CommonType, 
    MetadataObject,
    MetadataField, 
} from '../types/metadata';


export class MetadataParser {
  static  readMetadataObject(baseDir:string):MetadataObject[] {
    const metadataObjects:MetadataObject[] = [];
    const objectDir = path.join(baseDir, 'objects','metadata');
    const objectPathList = fs.readdirSync(objectDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry => entry.name));
    objectPathList.forEach((objectPath) => {
        const metadataObject = JSON.parse(
            fs.readFileSync(path.join(objectDir,objectPath)
            ,'utf-8')
        ) as MetadataObject;
        metadataObjects.push(metadataObject);
    })

    return metadataObjects;
  }

  static parseSingleObject(apiName: string): MetadataObject {
    const isMdt = apiName.endsWith('__mdt');
    const isCustom = apiName.endsWith('__c');
    const initialMetaFields: MetadataField[] = [
    { apiName: 'Id', dataType: 'standard', type: 'Id' },
    { apiName: 'Name', dataType: 'standard', type: 'String' },
    { apiName: 'CreatedDate', dataType: 'standard', type: 'DateTime' },
    { apiName: 'CreatedById', dataType: 'standard', type: 'Id', referenceObjectApiName: 'User' },
    { apiName: 'LastModifiedDate', dataType: 'standard', type: 'DateTime' },
    { apiName: 'LastModifiedById', dataType: 'standard', type: 'Id', referenceObjectApiName: 'User' },
    ];

    if (!isMdt) {
    initialMetaFields.push(
        { apiName: 'SystemModstamp', dataType: 'standard', type: 'DateTime' },
        { apiName: 'IsDeleted', dataType: 'standard', type: 'Boolean' }
    );
    }

    return {
      apiName: apiName,
      dataType: isMdt ? '__mdt' : isCustom ? '__c' : 'standard',
      fields: initialMetaFields,
    };
  }
  static parseSingleField(
    baseDir:string,
    apiName: string, 
    fieldApiName: string
 ): MetadataField {
    const fieldMetaPath = path.join(
      baseDir,
      apiName,
      'fields',
      `${fieldApiName}.field-meta.xml`
    );

    const parser = new XMLParser({
      ignoreAttributes: true,
      parseTagValue: true,
    });

    const xml = parser.parse(fs.readFileSync(fieldMetaPath, 'utf-8'));
    let type:CommonType = 'String';
    let referenceObjectApiName: string | undefined = undefined;
    switch (xml.CustomField.type) {
        case 'Checkbox':
            type = 'Boolean';
            break;
        case 'Number':
        case 'Currency':
        case 'Percent':
            type = xml.CustomField.scale === 0
            ? 'Integer'
            : 'Double';
            break;
        case 'Date':
            type = 'Date';
            break;
        case 'DateTime':
            type = 'DateTime';
            break;
        case 'Lookup':
        case 'MasterDetail':
            type = 'Id';
            referenceObjectApiName = xml.CustomField.referenceTo;
            break;
        default:
            break;
    }

    const metadataField: MetadataField = {
        apiName: fieldApiName,
        dataType: fieldApiName.endsWith('__c') ? '__c' : 'standard',
        type: type,
    }
    if (referenceObjectApiName) {
      metadataField.referenceObjectApiName = referenceObjectApiName;
    }

    return metadataField;
  }
}