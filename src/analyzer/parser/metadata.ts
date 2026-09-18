import fs from 'node:fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

import { MetadataCommonType, MetadataObject, MetadataField } from '../types/index';

export class MetadataParser {
    static async readMetadataObject(baseDir: string): Promise<MetadataObject[]> {
        const metadataObjects: MetadataObject[] = [];
        const objectDir = path.join(baseDir, 'objects');
        const objectPathList = (await fs.readdir(objectDir, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name);
        for (const objectPath of objectPathList) {
            const metadataObject = JSON.parse(
                await fs.readFile(path.join(objectDir, objectPath), 'utf-8'),
            ) as MetadataObject;
            metadataObjects.push(metadataObject);
        }

        return metadataObjects;
    }

    static parseSingleObject(apiName: string): MetadataObject {
        const isMdt = apiName.endsWith('__mdt');
        const isCustom = apiName.endsWith('__c');
        const initialMetaFields: MetadataField[] = [
            { apiName: 'Id', dataType: 'standard', type: 'Id' },
            { apiName: 'Name', dataType: 'standard', type: 'String' },
            { apiName: 'CreatedDate', dataType: 'standard', type: 'DateTime' },
            {
                apiName: 'CreatedById',
                dataType: 'standard',
                type: 'Lookup',
                referenceObjectApiName: 'User',
            },
            { apiName: 'LastModifiedDate', dataType: 'standard', type: 'DateTime' },
            {
                apiName: 'LastModifiedById',
                dataType: 'standard',
                type: 'Lookup',
                referenceObjectApiName: 'User',
            },
        ];

        if (!isMdt) {
            initialMetaFields.push(
                { apiName: 'SystemModstamp', dataType: 'standard', type: 'DateTime' },
                { apiName: 'IsDeleted', dataType: 'standard', type: 'Boolean' },
            );
        }

        return {
            apiName: apiName,
            dataType: isMdt ? '__mdt' : isCustom ? '__c' : 'standard',
            fields: initialMetaFields,
        };
    }
    static async parseSingleField(
        baseDir: string,
        apiName: string,
        fieldApiName: string,
    ): Promise<MetadataField> {
        const fieldMetaPath = path.join(
            baseDir,
            apiName,
            'fields',
            `${fieldApiName}.field-meta.xml`,
        );

        const parser = new XMLParser({
            ignoreAttributes: true,
            parseTagValue: true,
        });

        const xml = parser.parse(await fs.readFile(fieldMetaPath, 'utf-8'));
        let type: MetadataCommonType | 'Lookup' | 'MasterDetail' = 'String';
        let referenceObjectApiName: string = '';
        switch (xml.CustomField.type) {
            case 'Checkbox':
                type = 'Boolean';
                break;
            case 'Number':
            case 'Currency':
            case 'Percent':
                type = xml.CustomField.scale === 0 ? 'Integer' : 'Double';
                break;
            case 'Date':
                type = 'Date';
                break;
            case 'DateTime':
                type = 'DateTime';
                break;
            case 'Lookup':
            case 'MasterDetail':
                type = xml.CustomField.type === 'Lookup' ? 'Lookup' : 'MasterDetail';
                referenceObjectApiName = xml.CustomField.referenceTo;
                break;
            default:
                break;
        }

        if (type === 'Lookup' || type === 'MasterDetail') {
            return {
                apiName: fieldApiName,
                dataType: fieldApiName.endsWith('__c') ? '__c' : 'standard',
                type: type,
                referenceObjectApiName: referenceObjectApiName,
            };
        }

        return {
            apiName: fieldApiName,
            dataType: fieldApiName.endsWith('__c') ? '__c' : 'standard',
            type: type,
        };
    }
}
