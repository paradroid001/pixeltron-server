import { NetPlayer } from './NetPlayer';
import { PlayerConnections, PlayerConnection } from './PlayerConnection';
import { GameServerEvent } from './Protocol';

//Message Types
// whisper = dm
// say = local area
// to a channel
// Message contents = can embed item ids, quest ids, etc?
/*
export class Message
{
    msgText : string;
    msgType : number;
    constructor(msg: string, type: number = 0, args : any[] = [])
    {
        
    }
}
*/

export type Message = { msg: string; type: number; args: any[] };

export class Messaging {
    private channels: string[] = []; //just a list of channel names
    private players: PlayerConnections;
    private io: SocketIO.Server;

    constructor(io: SocketIO.Server, players: PlayerConnections) {
        this.players = players;
        this.io = io;
    }

    //work out what type it is, do something with it.
    public onMessage(msg: Message): void {
        //assume from = arg0
        const fromid = msg.args[0];
        const from: PlayerConnection = this.players.get(fromid);
        if (from) {
            this.broadcastMessage(msg.msg, from);
        }
    }

    private broadcastMessage(msg: string, from: PlayerConnection) {
        //let fromconnection : PlayerConnection = this.players.get(from.nid);
        if (from) {
            const name = from.player.name;
            from.socket.broadcast.emit(GameServerEvent.MESSAGE, name + ': ' + msg);
        }
    }

    //a message directly to another player.
    private directMessage(msg: string, from: NetPlayer, to: NetPlayer) {}

    //a message in a particular channel
    private channelMessage(msg: string, from: NetPlayer, to: string) {
        //this.io.emit()
    }

    //a message in the local area. Like a 'say'
    private localMessage(msg: string, from: NetPlayer) {}
}
