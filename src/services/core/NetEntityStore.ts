import { NetEntity, SyncAccess } from './NetEntity';
// singleton class to register all entities, which must derive from NetEntity
// key is network id.
export class NetEntityStore {
    private static _netID = 0; // the outward facing network id
    private static _entID = 0; // the inward entity id
    private static _instance: NetEntityStore;

    //Entity Store, Updates, Creations, and Destructions are all keyed by NID (number)
    private _estore: { [key: number]: any };
    private _updates: { [key: number]: any } = {};
    private _creations: { [key: number]: [string, any] } = {};
    private _destructions: number[] = [];

    //Entity owner store.
    private _eostore: { [key: number]: [NetEntity, NetEntity[]] };

    get updates(): any {
        return this._updates;
    }
    get creations(): any {
        return this._creations;
    }
    get destructions(): number[] {
        return this._destructions;
    }

    get entities(): any {
        return this._estore;
    }

    static get instance(): NetEntityStore {
        if (!NetEntityStore._instance) {
            NetEntityStore._instance = new NetEntityStore();
        }
        return NetEntityStore._instance;
    }

    static get nextNid(): number {
        return ++NetEntityStore._netID;
    }
    static get nextEid(): number {
        return ++NetEntityStore._entID;
    }

    private constructor() {
        this._estore = {};
        this.clearChanges();
    }

    public getEntity(nid: number): NetEntity {
        return this._estore[nid];
    }

    // adds a net entity and returns its nid
    public registerEntity(ent: NetEntity): number {
        ent.setIds(NetEntityStore.nextNid, NetEntityStore.nextEid);
        this._estore[ent.nid] = ent;
        // console.log("registered " + ent.constructor.name + " with nid " + ent.nid);

        // console.log("Syncrep: " + JSON.stringify( ent.syncRep() ) );
        // this._creations[ent.nid] = [ent.constructor.name, ent.syncRep()];
        return ent.nid;
    }

    // destroys an entity from the story
    public destroyEntity(ent: NetEntity): void {
        this._destructions.push(ent.nid);
        delete this._estore[ent.nid];
    }

    public getNewEntities(): string[] {
        const retval: string[] = [];
        for (const key in this._estore) {
            const value: NetEntity = this._estore[key];
            if (value.isNew) retval.push(key);
        }
        return retval;
    }

    public tickEntities(): void {
        for (const key in this._estore) {
            // TODO: do we want to make sure we're not
            // ticking 'new' or 'destroyed' entities?
            this._estore[key].tick();
        }
    }

    // return a json string of all updates
    public collectChanges(): void {
        for (const key in this._estore) {
            const value: NetEntity = this._estore[key];
            // first check if the key is in the creations,
            // or in the deletions
            // only do an update if it ISNT.
            // Would have used hasOwnProperty and indexOf here,
            // but the keys are strings, even though they were set with numbers.
            // hence using [] on the object and +key on the array to turn it into a number
            if (this._destructions.indexOf(+key) < 0) {
                if (value.isNew) {
                    // console.log(`entity with nid ${value.nid} was new`);
                    this._creations[key] = [value.classname, value.syncRep(SyncAccess.PUBLIC, true)];
                    // it's not new any more
                    value.isNew = false;
                } else if (value.isDirty()) {
                    // console.log(`entity with nid ${value.nid} was dirty`);
                    this._updates[key] = value.syncRep(); //defaults to SyncAccess.PUBLIC
                }
            }
            // consider it sent. now it's clean.
            // even if it was created, it had it's data sent, so if it was also marked dirty
            // we want to clear that so that it isn't sent AGAIN in an update.
            value.clean();
        }
    }

    // you've finished sending changes out, now reset everything.
    public clearChanges(): void {
        this._creations = {};
        this._updates = {};
        this._destructions = [];
    }

    // get all the ents and get their syncreps as 'all dirty'
    // omitting some keys though (generally whatever is in creation list)
    // remember keys are technically strings, even if numbers.
    public completeStore(omitkeys: string[]): { [key: number]: [string, any] } {
        const c: { [key: string]: [string, any] } = {};
        for (const key in this._estore) {
            if (omitkeys.indexOf(key) < 0) {
                // if not omitted
                const ent = this._estore[key];
                //This will only give publics. Privates will have to come seperate?
                c[ent.nid] = [ent.classname, ent.syncRep(SyncAccess.PUBLIC, true)];
                // logger.info(`storeascreations: ${key} : ${ent.classname}`);
            }
        }
        return c;
    }
}
