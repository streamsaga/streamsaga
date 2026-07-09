import mongoose, { Document, Schema } from 'mongoose';

export type OtpPurpose = 'register' | 'password-reset';

export interface IOtp extends Document {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  createdAt: Date;
}

const OtpSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['register', 'password-reset'],
    default: 'register',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Document automatically expires and is deleted from DB after 10 minutes (600 seconds)
  },
});

// Compound index so the same email can have OTPs for different purposes simultaneously
OtpSchema.index({ email: 1, purpose: 1 });

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
