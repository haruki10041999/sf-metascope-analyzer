import fs from 'node:fs/promises';
import path from 'path';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { ApexClass } from '../types';

export class ApexParser {
    static async readApexClass(baseDir: string): Promise<ApexClass[]> {
        const apexClasses: ApexClass[] = [];
        const apexClasstDir = path.join(baseDir, 'class');
        const apexClassPathList = (await fs.readdir(apexClasstDir, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name);
        for (const apexClassPath of apexClassPathList) {
            const apexClass = JSON.parse(
                await fs.readFile(path.join(apexClasstDir, apexClassPath), 'utf-8'),
            ) as ApexClass;
            apexClasses.push(apexClass);
        }

        return apexClasses;
    }
}
