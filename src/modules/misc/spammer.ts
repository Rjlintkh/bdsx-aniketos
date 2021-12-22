import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

export default class Spammer extends ModuleBase {
    info(): void {
        /**
         * @name: Spammer
         * @version: 1.0.0
         * @description: Blocks Horion spammer
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Text), (pk, ni) => {
            if (/^Horion - the best minecraft bedrock utility mod - horion\.download( \| [\w]{8})?$/.test(pk.message)) {
                this.suspect(ni, "Horion spammer.");
                return CANCEL;
            }
        });
    }
    unload(): void {
    }
}