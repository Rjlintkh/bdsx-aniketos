import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { InteractPacket } from "bdsx/bds/packets";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";


export default class Reach extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "threshold" = 0.5;
    };
    langModel = () => {
    /*
        name=Reach
        description=Checks if players aim entities further than expected distance.

        suspect.tooFarAway=Aiming too far away from [%s Blocks].
    */};

    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Interact), (pk, ni) => {
            if (pk.action === InteractPacket.Actions.Mouseover) {
                const player = ni.getActor()!;
                if (!Utils.isCreativeLikeModes(player)) {
                    const currentPos = player.getPosition();
                    if (pk.pos.x !== 0 && pk.pos.y !== 0 && pk.pos.z !== 0) {
                        let dx = currentPos.x - pk.pos.x;
                        let dy = currentPos.y - pk.pos.y;
                        let dz = currentPos.z - pk.pos.z;
                        let dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        if (dl > 3 + (this.getConfig().threshold ?? 0)) {
                            this.suspect(ni, this.translate("suspect.tooFarAway", [dl.toString()]));
                            return CANCEL;
                        }
                    }
                }
            }
        });
    }
    unload(): void {
    }
}