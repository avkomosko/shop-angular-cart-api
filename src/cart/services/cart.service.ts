import { Injectable } from '@nestjs/common';
import { SQL } from 'sql-template-strings';

import { v4 } from 'uuid';

import { Cart } from '../models';

import { Client, ClientConfig } from 'pg';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;

const dbOptions: ClientConfig = {
  host: PG_HOST,
  port: Number(PG_PORT),
  database: PG_DATABASE,
  user: PG_USERNAME,
  password: PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000
};

const client = new Client(dbOptions);

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  findByUserId(userId: string): Cart {
    return this.userCarts[ userId ];
  }

  async createByUserId(userId: string) {
    const id = v4(v4());

    try {
      await client.connect();
      const query = {
        text: 'create table if not exists carts ( id uuid primary key default "$1", created_at date NOT NULL, updated_at date NOT NULL )',
        values: [ id ]
      }

      const dbCartsResult = await client.query(
        SQL
       `
        CREATE TABLE IF NOT EXISTS carts (
          id uuid PRIMARY KEY DEFAULT ${id},
          created_at date NOT NULL,
          updated_at date NOT NULL
        )`
      );
      const dbCartItemsResult = await client.query(`
          create table if not exists cart_items (
            cart_id uuid,
            product_id uuid,
            count integer,
            foreign key ("cart_id") references "carts" ("id")
        )`
      );

      const dbInsertCartsResult = await client.query(`
        insert into carts (created_at, updated_at) values
          (now(), now())
        )`
      );

      const dbInsertCartItemsResult = await client.query(
        'insert into cart_items (cart_id, product_id, count) values ("ad2f9940-537f-4c2d-b889-e7ebd93753f7", "bd3c0f60-42c5-4e3a-a94d-111111111111", 2),("ad2f9940-537f-4c2d-b889-e7ebd93753f7", "28cf0889-5e6c-40b1-bb8d-222222222222", 1)'
      );

      const { rows } = await client.query('select * from cart_items');

    } catch(e) {
      console.error(e);
    } finally {
      client.end();
    }

    const userCart = {
      id,
      items: [],
    };

    this.userCarts[ userId ] = userCart;

    return userCart;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const { id, ...rest } = await this.findOrCreateByUserId(userId);

    const updatedCart = {
      id,
      ...rest,
      items: [ ...items ],
    }

    this.userCarts[ userId ] = { ...updatedCart };

    return { ...updatedCart };
  }

  removeByUserId(userId): void {
    this.userCarts[ userId ] = null;
  }

}
