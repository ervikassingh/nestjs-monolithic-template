import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../common/entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}
  
  create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepo.create(createOrderDto);
    return this.orderRepo.save(order);
  }

  findAll() {
    return this.orderRepo.find();
  }

  findOne(id: string) {
    return this.orderRepo.findOneBy({ id });
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.orderRepo.update(id, updateOrderDto)
      .then(() => this.findOne(id))
      .catch(error => {
        throw new Error(`Failed to update order with ID ${id}: ${error.message}`);
      }
    );
  }

  remove(id: string) {
    return this.orderRepo.delete(id)
      .then(result => {
        if (result.affected === 0) {
          throw new Error(`Order with ID ${id} not found`);
        }
        return { message: 'Order deleted successfully' };
      })
      .catch(error => {
        throw new Error(`Failed to delete order with ID ${id}: ${error.message}`);
      });
  }
}
