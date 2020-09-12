- be able to use env vars in config files like winston config, etc.
- it would be really good to have all logging coming from one point, or find a better way of including logging - lint seems to hate the require line.

- LINT everything
- Comment major functions in core for JSDoc
- Get disconnections / reconnections working.



TODO:

- no client side deletes? (see Ruins Protocol)
- client disconnects, other clients still see (should be fixed by client side deletes)
recieving actionstatuses doesn't do anything
- kill server: clients don't do anything (should drop out to login screen)
	extra: kill server, run again quickly, clients reconnect and don't flush state, download map over the top of old map, etc.
- When in console, keystrokes still move character.
- The way syncmap etc works (it's static on the base class), I think the aliases will all have to be unique for all derived classes, and if they clash they will overwrite one another. unless we have subkeys of the classnames within syncmap which becomes a dict?
- If you create a NetEntity server side it will automatically be synced to clients. Need a way to say 'dont do this!'. Example is server creates a netentity to track state for something - because it implements all the action ticking api etc, but server doesn't want this propagated to clients. Even if all syncs were private or there's no sync properties, it's still going to create the object and tell the client to create one too (the client probably wouldn't be able to handle it though..). Maybe a better example is the server sets up a temporary container or item or something for you but it's meant to stay server side only. Just constructing the entity will make it on the client too. 
- so it's pretty obvious now that actionstatuses are synced entities, and there's going to be plenty of other 'transient' synced entities too. It should all build apon NetEntity, which should probably be abstracted down one layer to become NetInfo. All the pub / pri / etc should be, if possible, just enums that the game defines (public is probably pretty universal) - but the field is just an int, possibly binary flag, and the host 'game' can name them and implement logic for them however it sees fit. This is probably a biggish change. This comment may change the aboveone.
- Unity doesn't seem to be halting on errors? Possibly because I have exceptions turned off and I'm on build mode for web: if I change back to PC, do they start up again? Not sure. But it was stopping NPCs from being created because a container prefab didn't have properties set.
WISHLIST:
- [DONE] client see lag (hit p)
- [DONE] server config of client colours 
- client manual disconnect
- [DONE] pick up items
- see items in inventory
- move say, item info to an event based system.
- npc's need to register for action handlers just like players?
	- only if you want them to do custom things when stuff gets updated. So for some things, yes.


So it's not just about NIDS getting used up (estimate: with 500k users, 1million items, 25 zones of 200x200 tiles each, game would still only use 0.1% of availabile NIDS, leaving 99.9% for actions and updates.

It's more about the architecture. You wouldn't store these objects in the database by NID. You want the NIDs to be transient, they can reset or restart when the server restarts. And probably they should yes provide a mapping, not so much to a message but to an object type: we shouldn't have action statuses etc each with their own nid.

What we want is to think about entity or object ids being things you would serialise in the database. They don't have to actually be database IDs, but really the game could have seperate 'internal' ids for actions/statuses, players, npcs, items, combat stuff, etc. So really the internal id is CATEGORY:OID (object id) where these can be seperate per category, i.e. they can start at 0. What database id this is can be seperate again. So when we transmit these things with a NID, we also say the category and the entity id so the client side can create the right structure. Then its easier to find objects by category and then id, rather than one big structure with all objects in it.

This kind of already happens with 'Actions' vs 'Entities' - we have two systems - so this needs to be generic, really, and at the basic level it is just those two categories, and then games built on top of the platform can add their own custom categories - they're almost like channels. I'm fine to call them this.

PERMISSIONS.
At the basic level, entire objects as well as individual properties need the ability to be either public (broadcast to everyone) or private (sent only to the player they become associated with). Some games may require the ability to further segregate who to send to, to say, all members of a party, or only to people within a radius of the object, or only to players who can 'see' the object. These games should be able to hook into an API to set this up. Additionally, it should be dynamic, i.e. an object could be assigned to public, and then later assigned to some other permission role. Individual properties can be explicitly set with a permission role, or set back to their default (specified when declared in decorator) - and properties override their parent object permissions: an object might be public, but a property on that object might be set to 'private'. This would apply to actions as well as entities.

NetEntity becomes NetObject?
Permission roles are a bitfield, public is 0, player is 1, and games can define the rest. JS only has INT, so it's stored in a single int.

I THINK the decorator sets these up on a per OBJECT basis, not a per class basis, otherwise we might be in trouble.

0 = public
1 = player
2 = party
4 = visible
8 = zone
16 = etc...

so you mark 'health' as 1 && 2 && 4 (111). Player objects would probably be the same. chat in a channel would be 'zone', so (1000). When the server loop comes to send updates, it's going to need to have been keeping track of the groupings it's specified: that's just part of the work of the server. 


