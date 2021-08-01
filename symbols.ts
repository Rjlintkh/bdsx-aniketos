//import { Actor, RawTypeId } from "bdsx";
import { Actor } from "bdsx/bds/actor";
import { Vec2, Vec3 } from "bdsx/bds/blockpos";
import { PlayerAuthInputPacket } from "bdsx/bds/packets";
import { ServerPlayer } from "bdsx/bds/player";
import { pdb } from "bdsx/core";
import { UNDNAME_NAME_ONLY } from "bdsx/dbghelp";
import { Event } from "bdsx/eventtarget";
import { nativeClass, NativeClass, nativeField } from "bdsx/nativeclass";
import { bool_t, uint32_t, void_t } from "bdsx/nativetype";
import { ProcHacker } from "bdsx/prochacker";
import * as path from "path";


const hacker = ProcHacker.load(path.join(__dirname, "pdbcache.ini"), [
    "Mob::isSprinting",
    "ServerMoveInputHandler::digestPlayerInputPacket",
    "ServerPlayer::getServerMoveInputHandler",
], UNDNAME_NAME_ONLY);
pdb.setOptions(0);
pdb.close();

@nativeClass(null)
export class ServerMoveInputHandler extends NativeClass {
    @nativeField(Vec2, 0x08)
    move: Vec2;
    @nativeField(bool_t, 0x48)
    sneaking: boolean;
    @nativeField(bool_t, 0x49)
    sneakingDown: boolean;
    @nativeField(bool_t, 0x4A)
    sprinting: boolean;
    @nativeField(bool_t, 0x4B)
    wantUp: boolean;
    @nativeField(bool_t, 0x4C)
    wantDown: boolean;
    @nativeField(bool_t, 0x4D)
    wantDownSlow: boolean;
    @nativeField(bool_t, 0x4E)
    wantUpSlow: boolean;
    @nativeField(bool_t, 0x4F)
    jumping: boolean;
    @nativeField(bool_t, 0x50)
    autoJumpingInWater: boolean;
    @nativeField(bool_t, 0x51)
    ascendScaffolding: boolean;
    @nativeField(bool_t, 0x52)
    descendScaffolding: boolean;
    @nativeField(bool_t, 0x53)
    sneakingToggleDown: boolean;
    @nativeField(bool_t, 0x54)
    ascend: boolean;
    @nativeField(bool_t, 0x55)
    descend: boolean;
    @nativeField(bool_t, 0x56)
    northJump: boolean;
    @nativeField(bool_t, 0x57)
    jumpDown: boolean;
    @nativeField(bool_t, 0x58)
    sprintDown: boolean;
    @nativeField(bool_t, 0x59)
    changeHeight: boolean;
    @nativeField(bool_t, 0x5A)
    persistSneak: boolean;
    @nativeField(bool_t, 0x5B)
    up: boolean;
    @nativeField(bool_t, 0x5C)
    down: boolean;
    @nativeField(bool_t, 0x5D)
    left: boolean;
    @nativeField(bool_t, 0x5E)
    right: boolean;
    @nativeField(bool_t, 0x5F)
    upLeft: boolean;
    @nativeField(bool_t, 0x60)
    upRight: boolean;
    @nativeField(Vec3, 0x6C)
    gazeDir: Vec3;
}

export enum PlayerAuthInputPacket$InputData {
    Ascend = 0,
    Descend = 1,
    NorthJump = 2,
    JumpDown = 3,
    SprintDown = 4,
    ChangeHeight = 5,
    Jumping = 6,
    AutoJumpingInWater = 7,
    Sneaking = 8,
    SneakDown = 9,
    Up = 0x0A,
    Down = 0x0B,
    Left = 0x0C,
    Right = 0x0D,
    UpLeft = 0x0E,
    UpRight = 0x0F,
    WantUp = 0x10,
    WantDown = 0x11,
    WantDownSlow = 0x12,
    WantUpSlow = 0x13,
    Sprinting = 0x14,
    AscendScaffolding = 0x15,
    DescendScaffolding = 0x16,
    SneakToggleDown = 0x17,
    PersistSneak = 0x18,
    InputNum = 0x19,
}

export const Mob$isSprinting = hacker.js("Mob::isSprinting", bool_t, null, Actor);
export const PlayerAuthInputPacket$getInput = hacker.js("PlayerAuthInputPacket::getInput", bool_t, null, PlayerAuthInputPacket, uint32_t);
//export const ServerMoveInputHandler$digestPlayerInputPacket = hacker.js("ServerMoveInputHandler::digestPlayerInputPacket", void_t, null, ServerMoveInputHandler, PlayerAuthInputPacket);
const PlayerAuthInputMap = new Map<string, ServerPlayer>();
export const PlayerAuthInputEvent = new Event<(res: ServerMoveInputHandler, pk: PlayerAuthInputPacket, p: ServerPlayer)=>void>();

{
    const func = hacker.hooking("ServerPlayer::getServerMoveInputHandler", ServerMoveInputHandler, null, ServerPlayer)(
        (player: ServerPlayer): ServerMoveInputHandler => {
            const handler = func(player);
            PlayerAuthInputMap.set(handler.toString(), player);
            return handler;
        }
    );
}

{
    const func = hacker.hooking("ServerMoveInputHandler::digestPlayerInputPacket", void_t, null, ServerMoveInputHandler, PlayerAuthInputPacket)(
        (handler: ServerMoveInputHandler, packet: PlayerAuthInputPacket): void_t => {
            func(handler, packet);
            PlayerAuthInputEvent.fire(handler, packet, PlayerAuthInputMap.get(handler.toString())!);
        }
    );
}