import { faker } from '@faker-js/faker';

export interface UserData {
  name: string;
  job: string;
  email: string;
}

export interface ProductData {
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export interface CartData {
  userId: number;
  products: Array<{ productId: number; quantity: number }>;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const testDataFactory = {
  user(): UserData {
    return {
      name: faker.person.fullName(),
      job: faker.person.jobTitle(),
      email: faker.internet.email(),
    };
  },

  product(): ProductData {
    return {
      title: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      description: faker.commerce.productDescription(),
      category: faker.commerce.department().toLowerCase(),
      image: 'https://i.pravatar.cc/150',
    };
  },

  cart(userId = 1): CartData {
    return {
      userId,
      products: [
        { productId: faker.number.int({ min: 1, max: 20 }), quantity: faker.number.int({ min: 1, max: 5 }) },
        { productId: faker.number.int({ min: 1, max: 20 }), quantity: faker.number.int({ min: 1, max: 3 }) },
      ],
    };
  },

  credentials(): Credentials {
    return {
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    };
  },

  address(): AddressData {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    };
  },

  phone(): string {
    return faker.phone.number();
  },

  uuid(): string {
    return faker.string.uuid();
  },
};
