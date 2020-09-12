import { Action } from './Action';
import { NetEntityStore } from './NetEntityStore';
import logger from '../../utils/Logging';

// THIS IS A HACK, actions should be mapped in the
// protocol specificallyfor whichever game you want to
// be able to make.
export class ActionMove extends Action {
    constructor(sourcenid: number, aid: number) {
        super(sourcenid, aid);
    }

    protected step(dt: number) {
        const actor: any = NetEntityStore.instance.getEntity(this.sourcenid);
        // TODO this is relative movement
        // is that OK?
        actor.position.x += this.args[0];
        actor.position.y += this.args[1];
        logger.debug('stepped the action!');
    }
}
