import logger from '../../utils/Logging';
import { GameServerEventField } from './Protocol';
// import { GameServer } from "./GameServer";
// import { NetEntityStore } from "./NetEntity";
import { ActionStatus } from './ActionStatus';
import { ActionStore } from './ActionStore';

export class Action {
    private static _nextid = 0;
    sourcenid: number; // nid of actor
    aid: number; // local action id (for getting status replies)
    type: string; // what type of action
    args: any[]; // args it needs to do its work
    duration = 200; // how long the action takes (milliseconds)
    elapsed = 0; // how long has elapsed since starting the action
    status: ActionStatus; // the status of the action

    // callbacks - they will all return this action.
    protected _onbegin: (action: Action) => void;
    protected _onstep: (dt: number, action: Action) => void;
    protected _onend: (action: Action) => void;

    // When it starts
    public onBegin(fn: (action: Action) => void): Action {
        this._onbegin = fn;
        return this;
    }

    // Each tick it runs
    public onStep(fn: (dt: number, action: Action) => void): Action {
        this._onstep = fn;
        return this;
    }

    // Once it's done.
    public onEnd(fn: (action: Action) => void): Action {
        this._onend = fn;
        return this;
    }

    // if the Action has come from a client, it will have
    // a positive aID.
    // If it's serverside, don't supply one, and one will be
    // assigned.
    constructor(sourcenid: number, aid = -1) {
        this.sourcenid = sourcenid;
        if (aid < 0) aid = ++Action._nextid;
        this.aid = aid;
        this.args = [];
        this.status = new ActionStatus(this);
        // actions should be auto added to
        // the action store.
        ActionStore.instance.addAction(this);
    }

    // This is what will be called by the process actions engine.
    public run(dt: number) {
        // BEGIN
        if (this.elapsed === 0) {
            if (this._onbegin) this._onbegin(this);
            this.begin();
        }

        if (!(this.status.isCancelled || this.status.isInvalid)) {
            // STEP
            this.elapsed += dt;
            if (this._onstep) this._onstep(dt, this);
            this.step(dt);

            // END
            if (this.duration <= 0) this.progress(100);
            else this.progress((100 * this.elapsed) / this.duration);
            if (this._onend) {
                this._onend(this);
            }
            this.end();
        }
    }

    protected begin() {}

    // this is where actions do their work.
    // this should be overridden
    protected step(dt: number) {
        // override me.
    }

    protected end() {}

    // set an action as being complete
    complete(msg = ''): void {
        if (msg !== '') this.status.msg = msg;
        this.status.result = GameServerEventField.ACTION_STATUS_COMPLETED;
    }

    progress(percent: number): void {
        if (percent >= 100) {
            this.complete();
            percent = 100;
        } else this.status.result = GameServerEventField.ACTION_STATUS_INCOMPLETE;
        this.status.progress = percent;
    }

    public invalid(msg = ''): void {
        if (msg !== '') this.status.msg = msg;
        this.status.result = GameServerEventField.ACTION_STATUS_INVALID;
    }

    public cancel(msg: string): void {
        if (msg !== '') this.status.msg = msg;
        this.status.result = GameServerEventField.ACTION_STATUS_CANCELLED;
    }
}
