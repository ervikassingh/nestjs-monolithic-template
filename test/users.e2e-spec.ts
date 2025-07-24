import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import mongoose from 'mongoose';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { Role } from '../src/common/enums/roles.enum';

import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/e2e_test_db');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db?.dropDatabase();
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          expandVariables: true,
          envFilePath: ['.env', `.env.local`],
        }),
        AuthModule,
        UsersModule,
        MongooseModule.forRoot('mongodb://localhost:27017/e2e_test_db'),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = app.getHttpServer();

    const username = 'admin';
    const password = 'admin@123';
    basicAuthToken = Buffer.from(`${username}:${password}`).toString('base64');
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
  });

  let basicAuthToken: string;
  let accessToken: string;

  const adminUser: CreateUserDto = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'securepassword',
    role: Role.admin,
  };

  it('/auth/register [POST] - should create an admin user', async () => {
    const response = await request(server)
      .post('/auth/register')
      .set('Authorization', `Basic ${basicAuthToken}`)
      .send(adminUser);

    expect(response.status).toBe(201);
  });

  it('/auth/login [POST] - should login and receive JWT token', async () => {
    const response = await request(server)
      .post('/auth/login')
      .set('Authorization', `Basic ${basicAuthToken}`)
      .send({
        email: adminUser.email,
        password: adminUser.password,
      });

    console.log(response.status);

    expect(response.status).toBe(200);
    expect(response.body.access_token).toBeDefined();
    accessToken = response.body.access_token;
  });

  it('/users [POST] - should create a new user (admin only)', async () => {
    const newUser = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: Role.user,
    };

    const response = await request(server)
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.email).toBe(newUser.email);
  });

  it('/users [GET] - should get list of users with basic auth', async () => {
    const response = await request(server)
      .get('/users')
      .set('Authorization', `Basic ${basicAuthToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('/users [UPDATE] - should update a user with PATCH (as admin)', async () => {
    const users = await request(server)
      .get('/users')
      .set('Authorization', `Basic ${basicAuthToken}`);

    const targetUserId = users.body.find(
      (u) => u.email === 'testuser@example.com',
    )?._id;

    const response = await request(server)
      .patch(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Name');
  });

  it('/users [DELETE] - should delete a user (as admin)', async () => {
    const users = await request(server)
      .get('/users')
      .set('Authorization', `Basic ${basicAuthToken}`);

    const targetUserId = users.body.find(
      (u) => u.email === 'testuser@example.com',
    )?._id;

    const response = await request(server)
      .delete(`/users/${targetUserId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });
});
