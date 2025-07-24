import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name must be at most 50 characters long'],
  })
  name: string;

  @Prop({
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'],
  })
  email: string;

  @Prop({
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  })
  password: string;

  @Prop({
    enum: Role,
    default: Role.user,
  })
  role: Role;

  @Prop({
    match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number'],
  })
  phone?: string;

  @Prop({
    type: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: {
        type: String,
        match: [/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'],
      },
      country: { type: String, trim: true },
    },
    _id: false, // Prevents nested _id in subdocs
  })
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      thumbnail: { type: String },
      medium: { type: String },
      original: { type: String },
    },
    _id: false, // Prevents nested _id in subdocs
  })
  profileImages?: {
    thumbnail?: string;
    medium?: string;
    original?: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
