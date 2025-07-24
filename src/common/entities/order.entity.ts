import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.pending })
  status: OrderStatus;

  @Column({ nullable: false })
  customerName: string;

  @Column({ nullable: false })
  customerEmail: string;

  @Column({ nullable: false })
  shippingAddress: string;

  @Column({ nullable: false })
  billingAddress: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: false })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
