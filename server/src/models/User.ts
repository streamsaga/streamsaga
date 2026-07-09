import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface IKnownDevice {
  fingerprint: string;
  label: string;
  ip: string;
  lastUsed: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  tokenVersion: number;
  myList: Types.ObjectId[];
  knownDevices: IKnownDevice[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const knownDeviceSchema = new Schema<IKnownDevice>(
  {
    fingerprint: { type: String, required: true },
    label: { type: String, default: 'Unknown Device' },
    ip: { type: String, default: 'unknown' },
    lastUsed: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    myList: [{ type: Schema.Types.ObjectId, ref: 'Movie', default: [] }],
    knownDevices: { type: [knownDeviceSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.__v;
    delete ret.knownDevices; // Never expose device list to client
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
