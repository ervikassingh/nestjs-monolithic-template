import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderResponseDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({
    summary: 'Create a new order',
    description: 'Creates a new order with the provided details.',
  })
  @ApiBody({
    description: 'Order details to create a new order',
    type: CreateOrderDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    type: CreateOrderResponseDto,
  })
  @Post()
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @ApiOperation({
    summary: 'Get all orders',
    description: 'Retrieves all orders from the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of all orders.',
    type: [CreateOrderResponseDto],
  })
  @Get()
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  findAll() {
    return this.ordersService.findAll();
  }

  @ApiOperation({
    summary: 'Get an order by ID',
    description: 'Retrieves a specific order by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the order to retrieve',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The order has been successfully retrieved.',
    type: CreateOrderResponseDto,
  })
  @Get(':id')
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update an order by ID',
    description: 'Updates a specific order with the provided details.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the order to update',
    required: true,
    type: String,
  })
  @ApiBody({
    description: 'Order details to update the existing order',
    type: UpdateOrderDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The order has been successfully updated.',
    type: CreateOrderResponseDto,
  })
  @Patch(':id')
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @ApiOperation({
    summary: 'Delete an order by ID',
    description: 'Deletes a specific order by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the order to delete',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The order has been successfully deleted.',
    type: String,
  })
  @Delete(':id')
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
