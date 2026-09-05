import mongoose, { Document, Schema } from 'mongoose';

export interface IAffiliateTier {
  level: number;
  name?: string;
  minMembers?: number;
  commissionRate?: number;
  [key: string]: any;
}

export interface ISetting extends Document {
  key: string;
  value: any;
  [key: string]: any;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const SettingModel = mongoose.model<ISetting>('Setting', SettingSchema);
export default SettingModel;
