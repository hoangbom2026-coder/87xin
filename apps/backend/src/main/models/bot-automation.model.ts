import mongoose, { Document, Schema } from 'mongoose';

export interface IBotAutomation extends Document {
  name?: string;
  enabled?: boolean;
  schedule?: string;
  action?: string;
  config?: Record<string, any>;
  [key: string]: any;
}

export interface IBotLog extends Document {
  botId?: string;
  message?: string;
  level?: string;
  [key: string]: any;
}

export interface IBetBotConfig {
  minGamesPerBot: number;
  maxGamesPerBot: number;
  minDelayBetweenGamesSec: number;
  maxDelayBetweenGamesSec: number;
  [key: string]: any;
}

export interface IChatBotConfig {
  minDelayBetweenMessagesSec: number;
  maxDelayBetweenMessagesSec: number;
  [key: string]: any;
}

const BotAutomationSchema = new Schema<IBotAutomation>(
  {
    name: { type: String },
    enabled: { type: Boolean, default: false },
    schedule: { type: String },
    action: { type: String },
    config: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const BotAutomationModel = mongoose.model<IBotAutomation>('BotAutomation', BotAutomationSchema);
export default BotAutomationModel;
