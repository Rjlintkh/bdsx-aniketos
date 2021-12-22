import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { DeviceOS } from "bdsx/common";
import { events } from "bdsx/event";
import { DB } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Namespoof extends ModuleBase {
    info(): void {
        /**
         * @name: Namespoof
         * @version: 1.0.0
         * @description: Checks if the names of players are fake.
         */
    }
    configModel = ModuleConfig;
    load(): void {
        this.listen(events.packetSend(MinecraftPacketIds.PlayStatus), (pk, ni) => {
            if (pk.status === 3 && DB.getPlayerData(ni, "DeviceOS") === DeviceOS.PLAYSTATION) {
                const gamertag = DB.gamertag(ni);
                const name = ni.getActor()!.getName();
                if (name !== gamertag) {
                    this.suspect(ni, `Gamertag is overriden, [${gamertag}] => [${name}].`);
                    this.punish(ni, "Use your real gamertag.");
                }
            }
        });
    }
    unload(): void {
    }
}