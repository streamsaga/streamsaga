import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: 'StreamSaga' },
    siteDescription: { type: String, default: 'Watch movies and series anywhere.' },
    logoUrl: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
