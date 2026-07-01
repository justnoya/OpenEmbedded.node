// @ts-nocheck
import { ContainerNode } from "./nodes/ContainerNode.js";
import { SectionNode } from "./nodes/SectionNode.js";
import { TextDisplayNode } from "./nodes/TextDisplayNode.js";
import { ThumbnailNode } from "./nodes/ThumbnailNode.js";
import { MediaGalleryNode } from "./nodes/MediaGalleryNode.js";
import { SeparatorNode } from "./nodes/SeparatorNode.js";
import { ActionRowNode } from "./nodes/ActionRowNode.js";
import { ButtonNode } from "./nodes/ButtonNode.js";
import { EmbedNode } from "./nodes/EmbedNode.js";
import { EmbeddNode } from "./nodes/EmbeddNode.js";
import { SelectMenuNode } from "./nodes/SelectMenuNode.js";
import { AutoSelectNode } from "./nodes/AutoSelectNode.js";
import { TextInputNode } from "./nodes/TextInputNode.js";
import { BotNode } from "./nodes/BotNode.js";
import { WebhookNode } from "./nodes/WebhookNode.js";
import { OpenEmbeddedNode } from "./nodes/OpenEmbeddedNode.js";
import { MessageNode } from "./nodes/MessageNode.js";
import { ModalNode } from "./nodes/ModalNode.js";
import { ScheduleNode } from "./nodes/ScheduleNode.js";

// Discord Components V2 — new types
import { FileNode } from "./nodes/FileNode.js";
import { CheckboxGroupNode } from "./nodes/CheckboxGroupNode.js";
import { CheckboxNode } from "./nodes/CheckboxNode.js";
import { RadioGroupNode } from "./nodes/RadioGroupNode.js";
import { RadioButtonNode } from "./nodes/RadioButtonNode.js";
import { LabelNode } from "./nodes/LabelNode.js";
import { FileUploadNode } from "./nodes/FileUploadNode.js";

// Automation — Triggers
import { EventTriggerNode } from "./nodes/EventTriggerNode.js";
import { SlashCommandNode } from "./nodes/SlashCommandNode.js";
import { InteractionTriggerNode } from "./nodes/InteractionTriggerNode.js";

// Automation — Actions
import { SendMessageActionNode } from "./nodes/SendMessageActionNode.js";
import { EditMessageActionNode } from "./nodes/EditMessageActionNode.js";
import { DeleteMessageActionNode } from "./nodes/DeleteMessageActionNode.js";
import { AddRoleActionNode } from "./nodes/AddRoleActionNode.js";
import { RemoveRoleActionNode } from "./nodes/RemoveRoleActionNode.js";
import { ModerateActionNode } from "./nodes/ModerateActionNode.js";
import { SendDMActionNode } from "./nodes/SendDMActionNode.js";
import { AddReactionActionNode } from "./nodes/AddReactionActionNode.js";
import { CreateThreadActionNode } from "./nodes/CreateThreadActionNode.js";
import { ReplyActionNode } from "./nodes/ReplyActionNode.js";
import { PinMessageActionNode } from "./nodes/PinMessageActionNode.js";
import { CreateChannelActionNode } from "./nodes/CreateChannelActionNode.js";
import { FetchMemberActionNode } from "./nodes/FetchMemberActionNode.js";

// Automation — Flow Control
import { ConditionNode } from "./nodes/ConditionNode.js";
import { DelayNode } from "./nodes/DelayNode.js";
import { VariableNode } from "./nodes/VariableNode.js";
import { HttpRequestNode } from "./nodes/HttpRequestNode.js";
import { RandomPickNode } from "./nodes/RandomPickNode.js";

export const nodeTypes = {
  // Discord layout
  container: ContainerNode,
  embedd: EmbeddNode,
  section: SectionNode,
  // Discord content
  textDisplay: TextDisplayNode,
  thumbnail: ThumbnailNode,
  mediaGallery: MediaGalleryNode,
  separator: SeparatorNode,
  // Discord file
  file: FileNode,
  // Discord interactive
  actionRow: ActionRowNode,
  button: ButtonNode,
  embed: EmbedNode,
  selectMenu: SelectMenuNode,
  userSelect: AutoSelectNode,
  roleSelect: AutoSelectNode,
  mentionableSelect: AutoSelectNode,
  channelSelect: AutoSelectNode,
  textInput: TextInputNode,
  // Discord CV2 form
  checkboxGroup: CheckboxGroupNode,
  checkbox: CheckboxNode,
  radioGroup: RadioGroupNode,
  radioButton: RadioButtonNode,
  label: LabelNode,
  fileUpload: FileUploadNode,
  // Utility nodes
  bot: BotNode,
  webhook: WebhookNode,
  openembedded: OpenEmbeddedNode,
  message: MessageNode,
  modal: ModalNode,
  schedule: ScheduleNode,
  // Automation triggers
  eventTrigger: EventTriggerNode,
  slashCommand: SlashCommandNode,
  interactionTrigger: InteractionTriggerNode,
  // Automation actions
  sendMessageAction: SendMessageActionNode,
  editMessageAction: EditMessageActionNode,
  deleteMessageAction: DeleteMessageActionNode,
  addRoleAction: AddRoleActionNode,
  removeRoleAction: RemoveRoleActionNode,
  moderateAction: ModerateActionNode,
  sendDMAction: SendDMActionNode,
  addReactionAction: AddReactionActionNode,
  createThreadAction: CreateThreadActionNode,
  replyAction: ReplyActionNode,
  pinMessageAction: PinMessageActionNode,
  createChannelAction: CreateChannelActionNode,
  fetchMemberAction: FetchMemberActionNode,
  // Automation flow control
  condition: ConditionNode,
  delay: DelayNode,
  variable: VariableNode,
  httpRequest: HttpRequestNode,
  randomPick: RandomPickNode,
};
