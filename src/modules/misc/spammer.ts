import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class Spammer extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Spammer
        description=Blocks Horion spammer.

        suspect.horion=Horion spammer detected.
    */};
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Text), (pk, ni) => {
            if (/^Horion - the best minecraft bedrock utility mod - horion\.download( \| [\w]{8})?$/.test(pk.message)) {
                this.suspect(ni, this.translate("suspect.horion"));
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}