import AbstractGameCommand from "./commands/AbstractGameCommand";
import CommandAcceptJoinParty from "./commands/CommandAcceptJoinParty";
import CommandAutoShots from "./commands/CommandAutoShots";
import CommandCancelBuff from "./commands/CommandCancelBuff";
import CommandCancelTarget from "./commands/CommandCancelTarget";
import CommandDeclineJoinParty from "./commands/CommandDeclineJoinParty";
import CommandHit from "./commands/CommandHit";
import CommandInventory from "./commands/CommandInventory";
import CommandMoveTo from "./commands/CommandMoveTo";
import CommandNextTarget from "./commands/CommandNextTarget";
import CommandRequestDuel from "./commands/CommandRequestDuel";
import CommandSay from "./commands/CommandSay";
import CommandSayToAlly from "./commands/CommandSayToAlly";
import CommandSayToClan from "./commands/CommandSayToClan";
import CommandSayToParty from "./commands/CommandSayToParty";
import CommandSayToTrade from "./commands/CommandSayToTrade";
import CommandShout from "./commands/CommandShout";
import CommandSitStand from "./commands/CommandSitStand";
import CommandTell from "./commands/CommandTell";
import CommandUseItem from "./commands/CommandUseItem";
import ICommand from "./commands/ICommand";
import L2Buff from "./entities/L2Buff";
import L2Character from "./entities/L2Character";
import L2Creature from "./entities/L2Creature";
import L2DroppedItem from "./entities/L2DroppedItem";
import L2Item from "./entities/L2Item";
import L2Object from "./entities/L2Object";
import L2ObjectCollection from "./entities/L2ObjectCollection";
import L2Skill from "./entities/L2Skill";
import L2User from "./entities/L2User";
import { ShotsType } from "./enums/ShotsType";
import { GlobalEvents } from "./mmocore/EventEmitter";
import MMOClient from "./mmocore/MMOClient";
import MMOConfig from "./mmocore/MMOConfig";
import GameClient from "./network/GameClient";
import LoginClient from "./network/LoginClient";
import CommandValidatePosition from "./commands/CommandValidatePosition";
import CommandAttack from "./commands/CommandAttack";
import { EventHandlerType } from "./events/EventTypes";
import CommandCast from "./commands/CommandCast";
import CommandDwarvenCraftRecipes from "./commands/CommandDwarvenCraftRecipes";
import CommandCraft from "./commands/CommandCraft";
import L2Recipe from "./entities/L2Recipe";

export default interface Client {
  /**
   * Send a general message
   * @param text
   */
  say(text: string): void;
  /**
   * Shout a message
   * @param text
   */
  shout(text: string): void;
  /**
   * Send a PM
   * @param text
   * @param target
   */
  tell(text: string, target: string): void;
  /**
   * Send message to party
   * @param text
   */
  sayToParty(text: string): void;
  /**
   * Send message to clan
   * @param text
   */
  sayToClan(text: string): void;
  /**
   * Send message to trade
   * @param text
   */
  sayToTrade(text: string): void;
  /**
   * Send message to ally
   * @param text
   */
  sayToAlly(text: string): void;
  /**
   * Move to location
   * @param x
   * @param y
   * @param z
   */
  moveTo(x: number, y: number, z: number): void;
  /**
   * Hit on target. Accepts L2Object object or ObjectId
   * @param object
   * @param shift
   */
  hit(object: L2Object | number, shift?: boolean): void;
  /**
   * Attack a target
   * @param object
   * @param shift
   */
  attack(object: L2Object | number, shift?: boolean): void;
  /**
   * Cancel the active target
   */
  cancelTarget(): void;
  /**
   * Accepts the requested party invite
   */
  acceptJoinParty(): void;
  /**
   * Declines the requested party invite
   */
  declineJoinParty(): void;
  /**
   * Select next/closest attackable target
   */
  nextTarget(): L2Creature | undefined;
  /**
   * Request for inventory item list
   */
  inventory(): void;
  /**
   * Use an item. Accepts L2Item object or ObjectId
   * @param item
   */
  useItem(item: L2Item | number): void;
  /**
   * Request player a duel. If no char is provided, the command tries to request the selected target
   * @param char
   */
  requestDuel(char?: L2Character | string): void;
  /**
   * Enable/disable auto-shots
   * @param item
   * @param enable
   */
  autoShots(item: L2Item | ShotsType | number, enable: boolean): void;
  /**
   * Cancel a buff
   * @param object
   * @param buff
   * @param level
   */
  cancelBuff(object: L2Character | number, buff: L2Buff | number, level?: number): void;
  /**
   * Sit or stand
   */
  sitOrStand(): void;
  /**
   * Sync position with server
   */
  validatePosition(): void;
  /**
   * Cast a magic skill
   * @param magicId
   * @param ctrl
   * @param shift
   */
  cast(magicSkillId: number, ctrl?: boolean, shift?: boolean): void;
  /**
   * Open dwarven craft recipe book
   */
  dwarvenCraftRecipes(): void;
  /**
   * Craft an item
   * @param recipeId
   */
  craft(recipeId: number): void;
}

/**
 * Lineage 2 Client
 */
export default class Client {
  private _config: MMOConfig = new MMOConfig();

  private _lc!: LoginClient;

  private _gc!: GameClient;

  private _commands: Record<string, ICommand> = {
    say: CommandSay.prototype,
    shout: CommandShout.prototype,
    tell: CommandTell.prototype,
    sayToParty: CommandSayToParty.prototype,
    sayToClan: CommandSayToClan.prototype,
    sayToTrade: CommandSayToTrade.prototype,
    sayToAlly: CommandSayToAlly.prototype,

    moveTo: CommandMoveTo.prototype,
    hit: CommandHit.prototype,
    attack: CommandAttack.prototype,

    cancelTarget: CommandCancelTarget.prototype,

    acceptJoinParty: CommandAcceptJoinParty.prototype,
    declineJoinParty: CommandDeclineJoinParty.prototype,

    nextTarget: CommandNextTarget.prototype,

    inventory: CommandInventory.prototype,
    useItem: CommandUseItem.prototype,

    requestDuel: CommandRequestDuel.prototype,

    autoShots: CommandAutoShots.prototype,

    cancelBuff: CommandCancelBuff.prototype,
    sitOrStand: CommandSitStand.prototype,

    validatePosition: CommandValidatePosition.prototype,

    cast: CommandCast.prototype,

    dwarvenCraftRecipes: CommandDwarvenCraftRecipes.prototype,

    craft: CommandCraft.prototype,
  };

  get Me(): L2User {
    return this._gc?.ActiveChar;
  }

  get CreaturesList(): L2ObjectCollection<L2Creature> {
    return this._gc?.CreaturesList;
  }

  get PartyList(): L2ObjectCollection<L2Creature> {
    return this._gc?.PartyList;
  }

  get DroppedItems(): L2ObjectCollection<L2DroppedItem> {
    return this._gc?.DroppedItems;
  }
  get InventoryItems(): L2ObjectCollection<L2Item> {
    return this._gc?.InventoryItems;
  }
  get BuffsList(): L2ObjectCollection<L2Buff> {
    return this._gc?.BuffsList;
  }
  get SkillsList(): L2ObjectCollection<L2Skill> {
    return this._gc?.SkillsList;
  }
  get DwarfRecipeBook(): L2ObjectCollection<L2Recipe> {
    return this._gc?.DwarfRecipeBook;
  }
  get CommonRecipeBook(): L2ObjectCollection<L2Recipe> {
    return this._gc?.CommonRecipeBook;
  }

  constructor() {
    return new Proxy<Client>(this, {
      get(target: Client, propertyKey: string, receiver: any) {
        if (propertyKey in target) {
          // return (target as any)[objectKey];
          return Reflect.get(target, propertyKey, receiver);
        }
        if (propertyKey in target._commands) {
          const cmd = Object.create(target._commands[propertyKey] as AbstractGameCommand<MMOClient>);
          cmd.Client = target._gc;
          return (...args: any) => {
            return cmd.execute(...args);
          };
        }
      },
    });
  }

  registerCommand(commandName: string, commandHandler: ICommand): this {
    if (commandName in this._commands) {
      throw new Error(`Command ${commandName} is already registered.`);
    }
    this._commands[commandName] = commandHandler;
    return this;
  }

  setConfig(config: MMOConfig | object): this {
    this._config.assign(config);
    return this;
  }

  enter(config?: MMOConfig | object): this {
    if (config) {
      this.setConfig(config);
    }

    GlobalEvents.once("PlayOk", () => {
      this._gc = new GameClient(this._lc, this._config);
    });

    this._lc = new LoginClient(this._config);

    return this;
  }

  on(...params: EventHandlerType): this {
    let type: string;
    let handler: any;
    if (params.length >= 3) {
      type = `${params[0]}:${params[1]}`;
      handler = params[2];
    } else {
      type = params[0];
      handler = params[1];
    }
    GlobalEvents.on(type, handler as any);
    return this;
  }
}
