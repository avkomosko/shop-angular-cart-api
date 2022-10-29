create extension if not exists "uuid-ossp";

create table carts (
  id uuid primary key default uuid_generate_v4(),
  created_at date NOT NULL,
  updated_at date NOT NULL
)

insert into carts (created_at, updated_at) values
  (now(), now())

create table cart_items (
  cart_id uuid,
  product_id uuid,
  count integer,
  foreign key ("cart_id") references "carts" ("id")
)

insert into cart_items (cart_id, product_id, count) values
  ("ad2f9940-537f-4c2d-b889-e7ebd93753f7", "bd3c0f60-42c5-4e3a-a94d-34ef5f567206", 2),
  ("ad2f9940-537f-4c2d-b889-e7ebd93753f7", "28cf0889-5e6c-40b1-bb8d-35acad339f5f", 1)
