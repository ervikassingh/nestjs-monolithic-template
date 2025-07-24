import { ConsoleLogger, Injectable } from '@nestjs/common';

import * as fs from 'fs';
import {promises as fsPromises} from 'fs';
import * as path from 'path';

@Injectable()
export class MyLoggerService extends ConsoleLogger {
    async logToFile(entry){
        const formattedEntry = `${Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'Asia/Kolkata',
        }).format(new Date())}\t${entry}\n`

        try {
            if (!fs.existsSync(path.join(__dirname, '..', '..', 'logs'))){
                await fsPromises.mkdir(path.join(__dirname, '..', '..', 'logs'))
            }
            await fsPromises.appendFile(path.join(__dirname, '..', '..', 'logs', 'my-logger.log'), formattedEntry)
        } catch (e) {
            if (e instanceof Error) console.error(e.message)
        }
    }

    log(message: any, context?: string){
        const entry = `LOG\t[${context}]\t${message}`
        this.logToFile(entry);
        super.log(message, context);
    }

    error(message: any, stackOrContext?: string){
        const entry = `ERROR\t[${stackOrContext}]\t${message}`
        this.logToFile(entry);
        super.error(message, stackOrContext);
    }
}
