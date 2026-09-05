import mongoose, { Document, Schema } from 'mongoose';

export interface IProvider extends Document {
  code: string;
  name?: string;
  enabled?: boolean;
  [key: string]: any;
}

const ProviderSchema = new Schema<IProvider>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const ProviderModel = mongoose.model<IProvider>('Provider', ProviderSchema);
export default ProviderModel;
