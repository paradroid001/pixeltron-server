import { Action } from './Action';
import { GameServerEventField } from './Protocol';

export class ActionStatus {
    sourcenid: number;
    aid: number;
    result: string;
    progress: number;
    msg: string;

    constructor(initiator: Action) {
        this.sourcenid = initiator.sourcenid;
        this.aid = initiator.aid;
        this.result = '';
        this.progress = 0;
        this.msg = '';
    }

    get isInvalid(): boolean {
        return this.result === GameServerEventField.ACTION_STATUS_INVALID;
    }
    get isCancelled(): boolean {
        return this.result === GameServerEventField.ACTION_STATUS_CANCELLED;
    }
}
