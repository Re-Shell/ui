import { faker } from '@faker-js/faker';

/**
 * Test data generation utilities for Re-Shell UI
 */

export interface TestUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

export interface TestProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  rating: number;
}

export interface TestFormData {
  textField: string;
  emailField: string;
  passwordField: string;
  numberField: number;
  selectField: string;
  multiSelectField: string[];
  checkboxField: boolean;
  radioField: string;
  dateField: Date;
  textareaField: string;
}

/**
 * User data generator
 */
export const generateUser = (overrides?: Partial<TestUser>): TestUser => ({
  id: faker.string.uuid(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  fullName: faker.person.fullName(),
  avatar: faker.image.avatar(),
  role: faker.helpers.arrayElement(['admin', 'user', 'guest']),
  createdAt: faker.date.past(),
  ...overrides,
});

/**
 * Product data generator
 */
export const generateProduct = (overrides?: Partial<TestProduct>): TestProduct => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price()),
  category: faker.commerce.department(),
  image: faker.image.url(),
  inStock: faker.datatype.boolean(),
  rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.5 }),
  ...overrides,
});

/**
 * Form data generator
 */
export const generateFormData = (overrides?: Partial<TestFormData>): TestFormData => ({
  textField: faker.lorem.words(3),
  emailField: faker.internet.email(),
  passwordField: faker.internet.password(),
  numberField: faker.number.int({ min: 1, max: 100 }),
  selectField: faker.helpers.arrayElement(['option1', 'option2', 'option3']),
  multiSelectField: faker.helpers.arrayElements(['tag1', 'tag2', 'tag3', 'tag4'], { min: 1, max: 3 }),
  checkboxField: faker.datatype.boolean(),
  radioField: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
  dateField: faker.date.future(),
  textareaField: faker.lorem.paragraph(),
  ...overrides,
});

/**
 * Generate array of test data
 */
export function generateArray<T>(
  generator: () => T,
  count: number,
  transform?: (item: T, index: number) => T
): T[] {
  return Array.from({ length: count }, (_, index) => {
    const item = generator();
    return transform ? transform(item, index) : item;
  });
}

/**
 * Generate nested data structures
 */
export const generateNestedData = (depth: number = 3): any => {
  if (depth === 0) {
    return faker.helpers.arrayElement([
      faker.string.alpha(),
      faker.number.int(),
      faker.datatype.boolean(),
      null,
    ]);
  }

  const type = faker.helpers.arrayElement(['object', 'array']);
  
  if (type === 'array') {
    const length = faker.number.int({ min: 1, max: 5 });
    return Array.from({ length }, () => generateNestedData(depth - 1));
  } else {
    const keys = faker.number.int({ min: 1, max: 5 });
    const obj: Record<string, any> = {};
    
    for (let i = 0; i < keys; i++) {
      obj[faker.word.noun()] = generateNestedData(depth - 1);
    }
    
    return obj;
  }
};

/**
 * Generate edge case data
 */
export const edgeCases = {
  strings: {
    empty: '',
    whitespace: '   ',
    veryLong: 'a'.repeat(10000),
    unicode: '😀🎉🌍',
    specialChars: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\',
    html: '<script>alert("xss")</script>',
    sql: "'; DROP TABLE users; --",
    multiline: 'line1\nline2\nline3',
    rtl: 'مرحبا بالعالم',
  },
  
  numbers: {
    zero: 0,
    negative: -1,
    decimal: 3.14159,
    veryLarge: Number.MAX_SAFE_INTEGER,
    verySmall: Number.MIN_SAFE_INTEGER,
    infinity: Infinity,
    nan: NaN,
  },
  
  dates: {
    past: new Date('1900-01-01'),
    future: new Date('2100-12-31'),
    invalid: new Date('invalid'),
    epoch: new Date(0),
  },
  
  arrays: {
    empty: [],
    single: [1],
    mixed: [1, 'two', true, null, undefined],
    nested: [[1, 2], [3, 4], [5, 6]],
    circular: (() => {
      const arr: any[] = [1, 2, 3];
      arr.push(arr);
      return arr;
    })(),
  },
};

/**
 * Generate component prop combinations
 */
export function generatePropCombinations<P extends Record<string, any>>(
  propVariants: Record<keyof P, P[keyof P][]>
): P[] {
  const keys = Object.keys(propVariants) as (keyof P)[];
  const combinations: P[] = [];

  function generate(index: number, current: Partial<P>) {
    if (index === keys.length) {
      combinations.push({ ...current } as P);
      return;
    }

    const key = keys[index];
    const values = propVariants[key];

    for (const value of values) {
      generate(index + 1, { ...current, [key]: value });
    }
  }

  generate(0, {});
  return combinations;
}

/**
 * Stress test data generator
 */
export const stressTestData = {
  /**
   * Generate large dataset
   */
  largeDataset: (size: number = 10000) => {
    return generateArray(generateProduct, size);
  },

  /**
   * Generate deeply nested object
   */
  deeplyNested: (depth: number = 100) => {
    let obj: any = { value: 'leaf' };
    for (let i = 0; i < depth; i++) {
      obj = { child: obj, level: i };
    }
    return obj;
  },

  /**
   * Generate wide object
   */
  wideObject: (width: number = 1000) => {
    const obj: Record<string, any> = {};
    for (let i = 0; i < width; i++) {
      obj[`key${i}`] = faker.string.alpha();
    }
    return obj;
  },

  /**
   * Generate rapid updates
   */
  rapidUpdates: (count: number = 100, delayMs: number = 10) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      timestamp: Date.now() + i * delayMs,
      value: faker.number.int(),
    }));
  },
};

/**
 * Accessibility test data
 */
export const a11yTestData = {
  /**
   * Screen reader test content
   */
  screenReaderContent: {
    button: 'Click to submit form',
    link: 'Navigate to home page',
    image: 'Company logo',
    form: 'User registration form',
    table: 'Product inventory data',
  },

  /**
   * ARIA labels
   */
  ariaLabels: {
    navigation: 'Main navigation',
    search: 'Search products',
    close: 'Close dialog',
    menu: 'User menu',
    sort: 'Sort by price',
  },

  /**
   * Keyboard navigation sequences
   */
  keyboardSequences: {
    formFlow: ['Tab', 'Tab', 'Space', 'Tab', 'Enter'],
    menuNavigation: ['Tab', 'Enter', 'ArrowDown', 'ArrowDown', 'Enter'],
    dialogFlow: ['Tab', 'Tab', 'Escape'],
  },
};

/**
 * Internationalization test data
 */
export const i18nTestData = {
  /**
   * Generate multilingual content
   */
  multilingual: (languages: string[] = ['en', 'es', 'fr', 'de', 'ja']) => {
    return languages.reduce((acc, lang) => {
      faker.locale = lang;
      acc[lang] = {
        greeting: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        price: faker.commerce.price(),
        date: faker.date.future(),
      };
      return acc;
    }, {} as Record<string, any>);
  },

  /**
   * RTL languages test data
   */
  rtlContent: {
    arabic: 'مرحبا بك في موقعنا',
    hebrew: 'ברוכים הבאים לאתר שלנו',
    persian: 'به وب سایت ما خوش آمدید',
  },
};