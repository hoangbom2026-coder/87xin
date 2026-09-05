import mongoose, { Document, Schema } from 'mongoose';

export interface IGame extends Document {
  name: string;
  code?: string;
  category?: string;
  provider?: string;
  enabled?: boolean;
  visible?: boolean;
  thumbnail?: string;
  [key: string]: any;
}

const GameSchema = new Schema<IGame>(
  {
    name: { type: String, required: true },
    code: { type: String },
    category: { type: String },
    provider: { type: String },
    enabled: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },
    thumbnail: { type: String },
  },
  { timestamps: true },
);

const GameModel = mongoose.model<IGame>('Game', GameSchema);
export default GameModel;
