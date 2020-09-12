import logger from '../../utils/Logging';
import { NetEntityStore } from './NetEntityStore';

//Flags to control which clients an entity will sync to.
export class SyncAccess {
    static PUBLIC = 'pub';
    static PRIVATE = 'pri'; //only sync to owner player
    static VISIBLETO = 'vis'; //only sync to objects that can 'see' me (game determined)
}
export class NetEntity {
    static SYNCFLAG = '__SYNC';
    static _SYNCMAP: any = {}; //map of internal props (keys) to external aliases.
    static _SYNCACCESS: any = {};

    private _nid: number; //network id
    private _eid: number; //entity id = not sure if this is used in the end.
    private _new: boolean; // set to false first collectChanges
    protected _syncProps: string[] = [];
    private _dirtyprops: string[];
    private _actionids: number[];
    private _classtype: string;

    get nid(): number {
        return this._nid;
    }

    public set classname(val: string) {
        this._classtype = val;
    }
    public get classname(): string {
        return this._classtype;
    }

    public get isNew(): boolean {
        return this._new;
    }
    public set isNew(val: boolean) {
        this._new = false;
    }

    public isDirty(): boolean {
        return this._dirtyprops.length > 0;
    }

    //NOTE!! TODO: ditry uses actual prop name, probably should use alias if defined?
    protected dirty(prop: string): void {
        //dont use hasOwnProperty any more, because we are using the sync decorator now.
        //this means we technically don't have that property, we just have the getter and setter.
        if (/*this.hasOwnProperty(prop) &&*/ this._dirtyprops.indexOf(prop) < 0) {
            this._dirtyprops.push(prop);
            // logger.info("marked " + prop + " as dirty");
        }
        //else ..this else clause is no longer true. If we got here, it would mean it was already dirty
        //    logger.warn(`Entity with nid ${this._nid} tried to dirty unkown property ${prop}. Properties: ${Object.getOwnPropertyNames(this)}`);
    }
    public clean(): void {
        this._dirtyprops = []; // clear dirty properties
    }

    constructor() {
        this._new = true;
        this._classtype = this.constructor.name; // default.
        // console.log(this._classtype);
        this._syncProps = [];
        this._actionids = [];
        this.findSyncProperties();
        NetEntityStore.instance.registerEntity(this);
        this.clean();
    }

    private findSyncProperties() {
        //Create access levels if they don't already exist
        for (const accesslevel of [SyncAccess.PUBLIC, SyncAccess.PRIVATE, SyncAccess.VISIBLETO]) {
            if (!NetEntity._SYNCACCESS.hasOwnProperty(accesslevel)) {
                NetEntity._SYNCACCESS[accesslevel] = [];
            }
        }
        /*
        if ( !NetEntity._SYNCACCESS.hasOwnProperty(SyncAccess.PUBLIC) )
            NetEntity._SYNCACCESS[SyncAccess.PUBLIC] = [];
        if ( !NetEntity._SYNCACCESS.hasOwnProperty(SyncAccess.PRIVATE) )
            NetEntity._SYNCACCESS[SyncAccess.PRIVATE] = [];
        if ( !NetEntity._SYNCACCESS.hasOwnProperty(SyncAccess.VISIBLETO) )
            NetEntity._SYNCACCESS[SyncAccess.VISIBLETO] = [];
        */
        let obj: any = this['__proto__'];
        let done = false;

        while (!done) {
            const cons = obj.constructor;
            if (!cons) done = true;
            //no constructor.
            else {
                if (cons.hasOwnProperty(NetEntity.SYNCFLAG)) {
                    const metainfo: any = cons[NetEntity.SYNCFLAG];
                    //get the keys of the alias dict
                    const names: string[] = Object.getOwnPropertyNames(metainfo['alias']);
                    for (const propname of names) {
                        //console.log(`Registering ${this.classname}.${propname} via constructor after decorator`);
                        //this.registerSync[propname];
                        //Don't use registerSync because this isn't
                        //a 'hasOwnProperty' anymore.

                        //check the alias
                        let alias = cons[NetEntity.SYNCFLAG]['alias'][propname];
                        if (alias === '')
                            //because decorator default is ""
                            alias = propname;
                        this._syncProps.push(propname);
                        //map to static _SYNCMAP dict
                        NetEntity._SYNCMAP[propname] = alias;
                        //amalgamate access level lists.
                        for (const accesslevel of [SyncAccess.PUBLIC, SyncAccess.PRIVATE, SyncAccess.VISIBLETO]) {
                            //if it's in the access list but hasn;t been collapsed down yet
                            if (
                                metainfo[accesslevel].indexOf(propname) > -1 &&
                                NetEntity._SYNCACCESS[accesslevel].indexOf(propname) < 0
                            ) {
                                NetEntity._SYNCACCESS[accesslevel].push(propname);
                            }
                        }
                    }
                }
                if (obj['__proto__'] !== null) {
                    obj = obj['__proto__'];
                } else done = true;
            }
        }
        //console.log("Find Sync Properties finished.")
        //console.log(`SyncProps:`);
        //for (let prop of this._syncProps)
        //{
        //    console.log(prop);
        //}
    }

    //So this only works for UNDECORATED properties.
    protected registerSync(propName: string) {
        if (this.hasOwnProperty(propName)) {
            //console.log("Registering " + propName);
            this._syncProps.push(propName);
        }
    }

    public setIds(nid: number, eid: number) {
        this._nid = nid;
        this._eid = eid;
    }

    /*
    //unfortunately this is never used :(
    public json() : string
    {
        return JSON.stringify(this, this._syncProps);
    }
    */

    // return the sync representation of the object.
    // this is because we want to filter which props we give.
    // it's socket.io that controls the encoding to json,
    // so we can't filter the json ourselves with a replacer.
    // instead, we just generate temp objects.
    public syncRep(access: string = SyncAccess.PUBLIC, all = false): { [key: string]: any } {
        const retval: { [key: string]: any } = {};

        let dirtyprops: string[];
        if (all || this._new) {
            dirtyprops = this._syncProps;
            // this._new = false; (this line broke multiplayer)
        } else {
            dirtyprops = this._dirtyprops;
        }

        //let cons = this["__proto__"].constructor;
        //if (cons.hasOwnProperty(NetEntity.SYNCFLAG) )
        //{
        //    let metaInfo: any = cons[NetEntity.SYNCFLAG];

        for (const propname of dirtyprops) {
            // let i = 0; i < dirtyprops.length; i++)
            // const propname = dirtyprops[i];
            // console.log("Syncrep: " + propname);

            //console.log("Syncrep processing " + propname);
            //console.log( JSON.stringify(metaInfo) );

            //Only return values that match the access level.
            //that is, they're in the list of propnames for that access level.
            if (NetEntity._SYNCACCESS[access].indexOf(propname) > -1) {
                //swap propname for alias
                retval[NetEntity._SYNCMAP[propname]] = this[propname];
            }
        }
        //}
        return retval;
    }

    public tick(): void {
        // base class update
    }

    public destroy(): void {
        NetEntityStore.instance.destroyEntity(this);
    }
}

export function sync(alias = '', access: string = SyncAccess.PUBLIC): any {
    return function (target: any, key: string) {
        //To avoid the (weird) problem of decorated properties
        //essentially sharing data across all instances(!), we need to
        //actually store the data in a unique symbol key.
        //See this: https://netbasal.com/behind-the-scenes-how-typescript-decorators-operate-28f8dcacb224
        const _key = Symbol();

        //notice here we don't use typescript () =>, we use function
        const getter = function () {
            return this[_key];
        };
        //in the setter we set the value dirty if it changed,
        const setter = function (newval) {
            if (newval != this[_key]) {
                this[_key] = newval;
                //console.log(`${this.classname} just triggered dirty for ${key} with a value of ${newval}`);
                this.dirty(key);
            }
        };

        //So this part is how we populate the resulting syncdict of the instance.
        //Because decorators are run when the class is declared, this step
        //simply annotates the constructor with a __sync property, which THEN contains
        //the names of each property to sync. We set the values to be the 'alias' passed
        //into this function (empty string if no alias)
        //The second part will be in the NetEntity constructor, where the code will
        //crawl back through the constructors, collecting all these sync property names
        //and aliases. It will then populate _syncProps, and the prop/alias map in the
        //static SYNCMAP.
        //
        //All because the decorators are evaluated without the instance AND
        //before the constructor is run.
        //OH..and decorating them removes them being detected via hasOwnProperty :(
        const constructor = target.constructor;
        const metaInfo = {};
        metaInfo['alias'] = {}; //aliases keyed on real propname, value is alias.
        metaInfo[SyncAccess.PUBLIC] = []; //propnames that are public
        metaInfo[SyncAccess.PRIVATE] = []; //propnames that are private (player only)
        metaInfo[SyncAccess.VISIBLETO] = []; //propnames synced if ent is visible.
        const meta = constructor.hasOwnProperty(NetEntity.SYNCFLAG)
            ? (constructor as any)[NetEntity.SYNCFLAG]
            : Object.defineProperty(constructor, NetEntity.SYNCFLAG, {
                  value: metaInfo,
              })[NetEntity.SYNCFLAG];
        meta['alias'][key] = alias; //so we can ship data with the alias.
        meta[access].push(key); //push the key onto the right access queue
        const attrs = {
            get: getter,
            set: setter,
            enumerable: true,
            configurable: true,
        };

        Object.defineProperty(target, key, attrs);

        //return attrs;
    };
}
