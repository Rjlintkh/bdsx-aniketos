import { DimensionId } from "bdsx/bds/actor";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { TextPacket } from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bool_t, int32_t, void_t } from "bdsx/nativetype";
import { LL } from "../../utils";
import { ModuleBase, ModuleConfig } from "../base";

export default class BadPackets extends ModuleBase {
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Bad Packets
        description=Detects packets with invalid data and some bug fixes.

        suspect.chat.messageTooLong=Chat message is longer than 512 characters.
        suspect.chat.invalidType=Chat message is not of type chat.
        suspect.chat.mismatchedNames=Chat author and player name do not match.
    */};
    
    load(): void {
        this.listen(events.packetBefore(MinecraftPacketIds.Text), (pk, ni) => {
            if (pk.message.length > 512) {
                this.suspect(ni, this.translate("suspect.chat.messageTooLong"));
                pk.message = pk.message.substring(0, 512);
                return;
            }
            if (pk.type !== TextPacket.Types.Chat) {
                this.suspect(ni, this.translate("suspect.chat.invalidType"));
                pk.type = TextPacket.Types.Chat;
                return;
            }
            const name = ni.getActor()!.getName();
            if (pk.name !== name) {
                this.suspect(ni, this.translate("suspect.chat.invalidType"));
                pk.name = name;
                return;
            }
        });
        {
            // @ts-expect-error
            if (ServerPlayer.prototype.isRiding !== undefined) {
                this.listen(events.packetBefore(MinecraftPacketIds.MoveActorAbsolute), (pk, ni) => {
                    const player = ni.getActor()!;
                    // @ts-ignore
                    if (player.isRiding()) {
                        return CANCEL;
                    }
                });
            }
        }
        {
            // @ts-expect-error
            if (ServerPlayer.prototype.stopSleepInBed !== undefined) {
                const original = LL.hooking("?changeDimension@ServerPlayer@@UEAAXV?$AutomaticID@VDimension@@H@@_N@Z", void_t, null, ServerPlayer, int32_t, bool_t)
                ((player, dimensionId: DimensionId, useNetherPortal) => {
                    if (useNetherPortal && (player.getSleepTimer() > 0)) {
                        // @ts-ignore
                        player.stopSleepInBed(true, true);
                    }
                    return original(player, dimensionId, useNetherPortal);
                });
            }
        }
    }
    unload(): void {
    }
}