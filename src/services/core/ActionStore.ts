import logger from '../../utils/Logging';
import { GameServerEventField } from './Protocol';
import { Action } from './Action';
import { ActionStatus } from './ActionStatus';
// Holds all actions.
// Total poor man's singleton. I'm tired.
export class ActionStore {
    public static instance: ActionStore;
    actionQueue: Action[];
    actions: { [key: string]: [number, Action][] };
    actionStatuses: ActionStatus[];

    constructor() {
        ActionStore.instance = this;
        this.actions = {};
        this.actionStatuses = [];
        this.actionQueue = [];
    }

    public get numQueuedActions(): number {
        return this.actionQueue.length;
    }

    public get numActions(): number {
        return Object.keys(this.actions).length;
    }

    addAction(action: Action): void {
        const nidkey: string = action.sourcenid.toString();
        if (!this.actions.hasOwnProperty(nidkey)) {
            this.actions[nidkey] = []; // initialise
        }

        this.actions[nidkey].push([action.aid, action]); // initialise
        this.actionQueue.push(action);
    }

    public getActionsFor(nid: number): [number, Action][] {
        return this.actions[nid.toString()];
    }

    public getActionIndexFor(nid: number, aid: number): number {
        let retval = -1;
        const actionlist = this.getActionsFor(nid);
        for (const index in actionlist) {
            if (actionlist[index][0] === aid) {
                retval = +index;
                break;
            }
        }
        return retval;
    }

    public removeAction(action: Action): boolean {
        let retval = true;
        const actionlist = this.getActionsFor(action.sourcenid);
        const actionindex = this.getActionIndexFor(action.sourcenid, action.aid);
        // logger.debug(`removing action at ${actionindex} from ${actionlist}`);
        if (actionindex >= 0) {
            // Delete isn't good enough
            // delete actionlist[actionindex];
            actionlist.splice(actionindex, 1);
        } else retval = false;
        return retval;
    }

    public processActions(dt: number): void {
        for (const action of this.actionQueue) {
            // let action: Action = this.actionQueue[actionindex];
            action.run(dt);
            this.actionStatuses.push(action.status);
        }
    }

    // remove COMPLETE and INVALID actions.
    public removeFinishedActions(): void {
        // 1. Make a list actions keys
        const finishedKeys: string[] = [];
        const finishedActions: Action[] = [];
        for (const actionindex in this.actionQueue) {
            const action = this.actionQueue[actionindex];

            if (
                action.status &&
                (action.status.result === GameServerEventField.ACTION_STATUS_COMPLETED ||
                    action.status.result === GameServerEventField.ACTION_STATUS_INVALID ||
                    action.status.result === GameServerEventField.ACTION_STATUS_CANCELLED)
            ) {
                finishedActions.push(action);
                finishedKeys.push(actionindex);
            }
        }

        for (const action of finishedActions) {
            // console.log(`deleting action ${JSON.stringify(action, null, 2)}`);
            this.actionQueue.splice(this.actionQueue.indexOf(action), 1); // splice the element out
            if (!this.removeAction(action)) {
                logger.debug('could not remove action');
            }
        }
        /*
                logger.info("Found a completed action: " + action.status.msg);
                let actionlist = this.actions[action.sourcenid];
                for (let actionindex in actionlist)
                {
                    let aid = this.actions[action.sourcenid][actionindex][0];
                    if (aid == action.aid)
                    {
                        logger.debug(`Deleting action nid=${key}, aid=${aid}`);
                        delete actionlist[actionindex];
                        delete this.actionQueue[key];
                    }
                }
                this.actions[action.sourcenid] = actionlist;
            }
        }
        */
        this.actionStatuses = [];
    }
}
