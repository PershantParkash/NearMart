import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: 'Delivery radius in kilometers' })
  deliveryRadius: number;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  shopkeeper: User;

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}