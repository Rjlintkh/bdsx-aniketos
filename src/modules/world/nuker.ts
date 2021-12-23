import { Block } from "bdsx/bds/block";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Nuker extends ModuleBase {
    configModel = class Config extends ModuleConfig {
        "threshold" = 1;
    };
    langModel = () => {
    /*
        name=Nuker
        description=Checks if players destroy blocks faster than expected time.

        suspect.instabreak=Invoked creative block destruction in survival mode.
        suspect.tooFast=Desktroyed block [%1] in [%2 ticks] but expected to be [%3 ticks].
        suspect.didNotStart=Desktroyed block [%1] before starting.
    */};
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action === PlayerActionPacket.Actions.CreativePlayerDestroyBlock) {
                if (!Utils.isCreativeLikeModes(ni.getActor()!)) {
                    this.suspect(ni, this.translate("suspect.instabreak"));
                    return CANCEL;
                }
            }
        });
        this.listen(events.blockDestructionStart, event => {
            if (!Utils.isCreativeLikeModes(event.player)) {
                const ni = event.player.getNetworkIdentifier();
                DB.setPlayerData(ni, Utils.getCurrentTick(), "Nuker.cracking");
            }
        });
        this.listen(events.blockDestroy, event => {
            const ni = event.player.getNetworkIdentifier();
            const tick = DB.getPlayerData(ni, "Nuker.cracking");
            const block = event.blockSource.getBlock(event.blockPos);
            if (tick) {
                const ticksNeeded = (this.getDestroyTime(event.player, block)) * 20;
                const ticksUsed = Utils.getCurrentTick() - tick + 1;
                
                if (ticksUsed + (this.getConfig().threshold ?? 0) < ticksNeeded) {
                    this.suspect(ni, this.translate("suspect.tooFast", [block.getName(), ticksUsed.toString(), ticksNeeded.toString()]));
                    return CANCEL;
                }
            } else {
                if (block.blockLegacy.getDestroyTime() !== 0) {
                    this.suspect(ni, this.translate("suspect.didNotStart", [block.getName()]));
                }
                return CANCEL;
            }
            DB.setPlayerData(ni, 0, "Nuker.cracking");
        });
    }
    unload(): void {
    }

    getDestroyTime(player: ServerPlayer, block: Block): number {
        const time = Math.round((
            (player.canDestroy(block) ? 
                block.blockLegacy.getDestroyTime() * 1.5 :
                block.blockLegacy.getDestroyTime() * 5)
             + Number.EPSILON) * 1000) / 1000;
        const multiplier = player.getDestroySpeed(block);
        return time / multiplier;
    }
}