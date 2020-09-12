import 'reflect-metadata';
import {
    createConnection,
    getRepository,
    getConnection,
    Connection,
    ConnectionOptions,
    ConnectionOptionsReader,
} from 'typeorm';
import logger from '../../utils/Logging';

import { PlayerAccount } from './entities/PlayerAccount';

export class DataService {
    private connection: Connection;

    constructor() {
        this.dbconn();
        logger.debug(JSON.stringify(getConnection().options));
    }

    public dbconn(): Promise<Connection> {
        return createConnection({
            type: 'sqlite',
            database: 'database.sqlite',
            synchronize: true, // sync entities every time we run
            logging: true,
            entities: [__dirname + '/entities/**/*.js'],
            migrations: [__dirname + '/migration/**/*.js'],
            subscribers: [__dirname + '/subscriber/**/*.js'],
            cli: {
                entitiesDir: __dirname + '/entities',
                migrationsDir: __dirname + '/migration',
                subscribersDir: __dirname + '/subscriber',
            },
        });
    }

    public createAccount(name: string, password: string, emailAddress: string, admin = false) {
        const account = new PlayerAccount();
        account.username = name;
        account.password = password;
        account.admin = admin;
        account.emailAddress = emailAddress;
        account.isLoggedIn = false;
        account.lastLoginTime = 0;
        account.lastLogoutTime = 0;

        this.dbconn().then(async (connection) => {
            const ar = connection.getRepository(PlayerAccount);
            await ar.save(account);
            // console.log('saved account, id is ' + account.id);
            const allaccounts = await ar.find();
            logger.debug('All accounts: ' + allaccounts);
        });
    }

    public login(username: string, password: string): boolean {
        let retval = false;
        this.dbconn()
            .then(async (connection) => {
                const ar = connection.getRepository(PlayerAccount);
                await ar.findOne({ username }).then((account) => {
                    retval = account.login(username, password);
                });
            })
            .catch((error) => console.log(error));
        return retval;
    }

    /*
    public connect() : Connection
    {
        return createConnection(
            {
                type: "sqlite",
                database: __dirname + "/database.sqlite",
                entities: [
                    __dirname + '/services/data/entities/**/ // *.ts}'
    /*
                ],
                synchronize: true,
                logging: false
            }
        );
        */
    /*
        .then(connection => {
            //do work with ents here.
        }).catch(error => logger.error(error));

    }
    */
}
