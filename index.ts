import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { Aniketos } from "./src/loader";
import AutoClicker from "./src/modules/combat/autoclicker";
import Reach from "./src/modules/combat/reach";
import BadPackets from "./src/modules/misc/bad_packets";
import Crasher from "./src/modules/misc/crasher";
import EditionFaker from "./src/modules/misc/edition_faker";
import Namespoof from "./src/modules/misc/namespoof";
import NoSwing from "./src/modules/misc/no_swing";
import Spammer from "./src/modules/misc/spammer";
import Toolbox from "./src/modules/misc/toolbox";
import AntiImmobile from "./src/modules/movement/anti_immobile";
import Flight from "./src/modules/movement/flight";
import Freecam from "./src/modules/movement/freecam";
import InventoryMove from "./src/modules/movement/inventory_move";
import FastEat from "./src/modules/world/fast_eat";
import Gamemode from "./src/modules/world/gamemode";
import Give from "./src/modules/world/give";
import Nuker from "./src/modules/world/nuker";
import XpOrb from "./src/modules/world/xp_orb";
import { DB } from "./src/utils";

DB // Import it to make sure it's loaded.

export const aniketos = new Aniketos();
aniketos.loadModule(new AntiImmobile);
aniketos.loadModule(new AutoClicker);
aniketos.loadModule(new BadPackets);
aniketos.loadModule(new Crasher);
aniketos.loadModule(new EditionFaker);
aniketos.loadModule(new FastEat);
aniketos.loadModule(new Flight);
aniketos.loadModule(new Freecam);
aniketos.loadModule(new Gamemode);
aniketos.loadModule(new Give);
aniketos.loadModule(new InventoryMove);
aniketos.loadModule(new Namespoof);
aniketos.loadModule(new NoSwing);
aniketos.loadModule(new Nuker);
aniketos.loadModule(new Reach);
aniketos.loadModule(new Spammer);
aniketos.loadModule(new Toolbox);
aniketos.loadModule(new XpOrb);

const packetLogger = false;

if (packetLogger) {
    for (let i = 1; i < 164; i++) {
        switch (i) {
            //case MinecraftPacketIds.MovePlayer:
            case MinecraftPacketIds.PlayerAuthInput:
            case MinecraftPacketIds.ClientCacheBlobStatus:
            case MinecraftPacketIds.ClientCacheMissResponse:
            case MinecraftPacketIds.LevelChunk:
            case MinecraftPacketIds.MoveActorDelta:

            case MinecraftPacketIds.LevelSoundEvent:
            case MinecraftPacketIds.SetActorData:
            case MinecraftPacketIds.NetworkChunkPublisherUpdate:
            case MinecraftPacketIds.SetTime:
            case MinecraftPacketIds.UpdateAttributes:
            case MinecraftPacketIds.SetActorMotion:
                continue;
        }
        events.packetAfter(i).on((pk: any, ni) => {
            console.log("RECV", pk, new Date());
        });
        // events.packetSend(i).on((pk: Packet, ni) => {
        //     if (pk.getId() === MinecraftPacketIds.InventoryTransaction) {
        //         console.log("RECV", "Inv Tran", new Date());
        //         return;
        //     }
        //     console.log("SEND", pk.getName(), new Date());
        // });
    }

    // events.packetBefore(MinecraftPacketIds.ItemStackRequest).on((pk, ni) => {
    //     console.log("DROP", pk);
    // });
}