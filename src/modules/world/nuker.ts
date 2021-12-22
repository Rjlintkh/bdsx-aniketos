import { Block } from "bdsx/bds/block";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { PlayerActionPacket } from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { DB, Utils } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class Nuker extends ModuleBase {
    info(): void {
        /**
         * @name: Nuker
         * @version: 1.0.0
         * @description: Checks if players destroy blocks faster than expected time.
         */
    }
    
    configModel = class Config extends ModuleConfig {
        "threshold" = 1;
    };
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.PlayerAction), (pk, ni) => {
            if (pk.action === PlayerActionPacket.Actions.CreativePlayerDestroyBlock) {
                if (!Utils.isCreativeLikeModes(ni.getActor()!)) {
                    this.suspect(ni, "Invoked creative block destruction in survival mode.");
                    return CANCEL;
                }
            }
        });
        this.listen(events.blockDestructionStart, event => {
            if (!Utils.isCreativeLikeModes(event.player)) {
                const ni = event.player.getNetworkIdentifier();
                DB.setPlayerData(ni, Utils.getCurrentTick(), "nuker.cracking");
            }
        });
        this.listen(events.blockDestroy, event => {
            const ni = event.player.getNetworkIdentifier();
            const tick = DB.getPlayerData(ni, "nuker.cracking");
            const block = event.blockSource.getBlock(event.blockPos);
            if (tick) {
                const ticksNeeded = (this.getDestroyTime(event.player, block)) * 20;
                const ticksUsed = Utils.getCurrentTick() - tick + 1;
                
                if (ticksUsed + (this.getConfig().threshold ?? 0) < ticksNeeded) {
                    this.suspect(ni, `Desktroyed block [${block.getName()}] in [${ticksUsed} ticks] but expected to be [${ticksNeeded} ticks].`);
                    return CANCEL;
                }
            } else {
                if (block.blockLegacy.getDestroyTime() !== 0) {
                    this.suspect(ni, `Desktroyed block [${block.getName()}] before starting.`);
                }
                return CANCEL;
            }
            DB.setPlayerData(ni, 0, "nuker.cracking");
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