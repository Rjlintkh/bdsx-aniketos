//import { bedrockServer, MinecraftPacketIds, nethook } from "bdsx";

import { events } from "../bdsx/event";

console.log("Thanks for using Aniketos");

events.serverOpen.on(() => {
    import("./modules");
    //import("./symbols");
    /*
    nethook.before(MinecraftPacketIds.AdventureSettings).on((pk, ni) => {
        console.log("AdvStg", {
            flag1: pk.flag1,
            flag2: pk.flag2,
            customFlag: pk.customFlag,
            commandPerm: pk.commandPermission,
            playerPerm: pk.playerPermission,
            uniId: pk.actorId,
        });
    });
    */
});