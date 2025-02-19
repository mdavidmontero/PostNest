import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
// import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Transaction,
  TransactionsContents,
} from './entities/transaction.entity';
import { Between, FindManyOptions, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { CouponsService } from 'src/coupons/coupons.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(TransactionsContents)
    private readonly transactionsContentsRepository: Repository<TransactionsContents>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly couponService: CouponsService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    await this.productRepository.manager.transaction(
      async (transactionEntityManager) => {
        const transaction = new Transaction();
        const total = createTransactionDto.contents.reduce(
          (total, item) => total + item.quantity * item.price,
          0,
        );
        transaction.total = total;
        if (createTransactionDto.coupon) {
          const coupon = await this.couponService.applyCoupon(
            createTransactionDto.coupon,
          );
          const discount = (coupon.percentage / 100) * total;
          transaction.discount = discount;
          transaction.coupon = coupon.name;
          transaction.total -= discount;
        }
        for (const contents of createTransactionDto.contents) {
          const product = await transactionEntityManager.findOneBy(Product, {
            id: contents.productId,
          });

          const errors = [];
          if (!product) {
            errors.push(`El producto ${contents.productId} no existe`);
            throw new NotFoundException(errors);
          }

          if (contents.quantity > product.inventory) {
            errors.push(
              `El articulo ${product.name} no tiene suficiente stock`,
            );
            throw new BadRequestException(errors);
          }
          product.inventory -= contents.quantity;

          const transactionContent = new TransactionsContents();
          transactionContent.price = contents.price;
          transactionContent.product = product;
          transactionContent.quantity = contents.quantity;
          transactionContent.transaction = transaction;

          await transactionEntityManager.save(transaction);
          await transactionEntityManager.save(transactionContent);
        }
      },
    );

    return 'Venta Almacenada correctamente';
  }

  findAll(transactionDate: string) {
    const options: FindManyOptions<Transaction> = {
      relations: {
        contents: true,
      },
    };
    if (transactionDate) {
      const date = parseISO(transactionDate);
      if (!isValid(date)) {
        throw new BadRequestException('Fecha no valida');
      }
      const start = startOfDay(date);
      const end = endOfDay(date);
      options.where = {
        transactionsDate: Between(start, end),
      };
    }
    return this.transactionsRepository.find(options);
  }

  async findOne(id: number) {
    const transaction = await this.transactionsRepository.findOne({
      where: {
        id,
      },
      relations: {
        contents: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`No se encontro la venta #${id}`);
    }
    return transaction;
  }

  // update(id: number, updateTransactionDto: UpdateTransactionDto) {
  //   return `This action updates a #${id} transaction`;
  // }

  async remove(id: number) {
    const transaction = await this.findOne(id);
    for (const contents of transaction.contents) {
      const product = await this.productRepository.findOneBy({
        id: contents.product.id,
      });
      product.inventory += contents.quantity;
      await this.productRepository.save(product);
      const transactionContents =
        await this.transactionsContentsRepository.findOneBy({
          id: contents.id,
        });
      await this.transactionsContentsRepository.remove(transactionContents);
    }
    await this.transactionsRepository.remove(transaction);
    return { message: 'Venta eliminada' };
  }
}
