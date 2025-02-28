import { User } from 'src/auth/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60 })
  name: string;
  @Column({
    type: 'varchar',
    length: 120,
    nullable: true,
    default: 'default.svg',
  })
  image: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ type: 'int' })
  inventory: number;

  // { eager: true }
  @ManyToOne(() => Category)
  category: Category;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => User, (user) => user.product, {
    eager: true,
  })
  user: User;
}
