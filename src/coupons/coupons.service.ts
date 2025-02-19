import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { endOfDay, isAfter } from 'date-fns';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}
  create(createCouponDto: CreateCouponDto) {
    return this.couponsRepository.save(createCouponDto);
  }

  findAll() {
    return this.couponsRepository.find();
  }

  async findOne(id: number) {
    const coupon = this.couponsRepository.findOneBy({ id });
    if (!coupon) {
      throw new NotFoundException(`El cupon con el ${id} no existe`);
    }
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.findOne(id);
    Object.assign(coupon, updateCouponDto);
    return await this.couponsRepository.save(coupon);
  }

  async remove(id: number) {
    const coupon = await this.findOne(id);
    await this.couponsRepository.remove(coupon);

    return { message: 'Cupon eliminado correctamente' };
  }

  async applyCoupon(name: string) {
    const coupon = await this.couponsRepository.findOneBy({ name: name });
    if (!coupon) {
      throw new NotFoundException(`El cupon ${name} no existe`);
    }

    const currentDate = new Date();
    const expirationDate = endOfDay(coupon.expirationDate);
    if (isAfter(currentDate, expirationDate)) {
      throw new UnprocessableEntityException('Cupón ya expirado');
    }
    return {
      message: 'Cupón valido',
      ...coupon,
    };
  }
}
