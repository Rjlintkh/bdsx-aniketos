import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { events } from "bdsx/event";
import { DB } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";
import { TitleId } from "./edition_faker";

export default class Toolbox extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Toolbox
        description=Fucks Toolbox players.

        suspect.generic=Toolbox detected.

        punish.generic=Do not use Toolbox.
    */};

    load(): void {
        this.listen(events.packetAfter(MinecraftPacketIds.Login), (pk, ni) => {
            const connreq = pk.connreq;
            if (connreq) {
                const model = connreq.getJsonValue()!["DeviceModel"];
                const brand = model.split(" ")[0];
                if (DB.titleId(ni) !== TitleId.IOS.toString() && brand.toUpperCase() !== brand) {
                    this.suspect(ni, this.translate("suspect.generic"));
                    this.punish(ni, this.translate("punish.generic"));
                }
            }
        });
    }
    unload(): void {
    }
}