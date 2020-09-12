import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import logger from '../../../utils/Logging';
@Entity()
export class PlayerAccount {
    @PrimaryGeneratedColumn() // auto increment
    id: number;
    @Column({ length: 20 })
    username: string;
    @Column({ length: 32 })
    password: string;
    @Column({ length: 64 })
    emailAddress: string;
    @Column()
    admin: boolean;
    @Column('int')
    lastLoginTime: number;
    @Column('int')
    lastLogoutTime: number;
    @Column()
    isLoggedIn: boolean;

    // Checks auth and returns if they logged in
    login(username: string, password: string): boolean {
        let retval = false;
        if (this.auth(password)) {
            this.lastLoginTime = Date.now(); // string date
            this.isLoggedIn = true;
            retval = true;
            logger.debug(username + 'Logged in');
        } else {
            logger.debug('Password mismatch for ' + username);
        }
        // if the password was false, do nothing.
        // its tempting to do 'isLoggedIn=false' here,
        // but then you could log out an account you didn't
        // own by trying to login with the username and a random
        // password
        return retval;
    }

    // checks passwords. Returns true or false
    auth(password: string): boolean {
        let retval = false;
        if (password === this.password) {
            // good. auth.
            retval = true;
        }
        return retval;
    }

    // logs player out
    logout(): void {
        this.isLoggedIn = false;
        this.lastLogoutTime = Date.now();
    }
}
