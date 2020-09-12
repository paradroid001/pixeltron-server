import { DataService } from './DataService';

const ds: DataService = new DataService();

ds.createAccount('test1', 'password', 'test1@test.com', false);
