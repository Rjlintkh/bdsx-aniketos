import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { DB } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";
import { TitleId } from "./edition_faker";

export default class Namespoof extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "punish" = false;
    };
    langModel = () => {
    /*
        name=Namespoof
        description=Checks if the names of players are fake.

        suspect.overriden=Gamertag is overriden, [%1] => [%2].

        punish.generic=Use your real gamertag.
    */};

    load(): void {
        this.listen(events.packetAfter(MinecraftPacketIds.Login), (pk, ni) => {
            const connreq = pk.connreq;
            if (connreq && DB.titleId(ni) !== TitleId.NINTENDO.toString() && DB.titleId(ni) !== TitleId.PLAYSTATION.toString()) {
                const gamertag = DB.gamertag(ni);
                const name = connreq.getJsonValue()?.ThirdPartyName;
                if (name && name !== gamertag) {
                    this.suspect(ni, this.translate("suspect.overriden", [gamertag, name]));
                    if (this.getConfig().punish) {
                        this.punish(ni, this.translate("punish.generic"));
                    } else {
                        DB.setPlayerData(ni, "Namespoof.real", gamertag);
                    }
                }
            }
        });
        this.listen(events.packetSend(MinecraftPacketIds.PlayStatus), (pk, ni) => {
            if (pk.status === 3) {
                const real = DB.getPlayerData(ni, "Namespoof.real");
                if (real) {
                    ni.getActor()!.setName(real);
                }

            }
        });
    }
    unload(): void {
    }
}