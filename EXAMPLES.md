# Re-Shell UI Examples

This document provides comprehensive examples of using Re-Shell UI components with the advanced TypeScript type system introduced in v0.3.0 and enhanced in v0.3.1.

## Table of Contents

1. [Type System Examples](#type-system-examples)
2. [CSS Validation & Type Safety](#css-validation--type-safety)
3. [Context System](#context-system)
4. [Design Tokens](#design-tokens)
5. [Polymorphic Components](#polymorphic-components)
6. [Component Variants](#component-variants)
7. [Theme Customization](#theme-customization)
8. [Advanced Patterns](#advanced-patterns)

## Type System Examples

### Using Branded Types for CSS Values

```tsx
import { px, rem, percent, hex, rgb, ms } from '@re-shell/ui';

// Type-safe CSS values
const styles = {
  width: px(200),           // Branded as Px type
  height: rem(10),          // Branded as Rem type
  margin: percent(50),      // Branded as Percent type
  color: hex('#3B82F6'),    // Validated hex color
  background: rgb(59, 130, 246), // RGB color
  transition: ms(300),      // Branded as Ms type
};

// Type errors are caught at compile time
// const invalid = hex('invalid'); // Error: Invalid hex color
// const badRgb = rgb(300, 0, 0);  // Error: RGB values must be between 0 and 255
```

### Conditional Props with Type Safety

```tsx
import { Button } from '@re-shell/ui';

// When disabled is true, onClick is not allowed
<Button disabled={true} onClick={() => {}}>
  Click me
</Button>
// TypeScript Error: Type '{ disabled: true; onClick: () => void; }' is not assignable

// When loading is true, onClick is not allowed
<Button loading={true} onClick={() => {}}>
  Submit
</Button>
// TypeScript Error: onClick cannot be used when loading is true

// Valid usage
<Button disabled={false} onClick={() => console.log('Clicked!')}>
  Click me
</Button>
```

### Discriminated Union Variants

```tsx
import { Button, ButtonVariant } from '@re-shell/ui';

// Primary variant doesn't support destructive
<Button variant={{ variant: 'primary', destructive: true }}>
  Delete
</Button>
// TypeScript Error: 'destructive' does not exist on type '{ variant: "primary" }'

// Secondary variant supports destructive
<Button variant={{ variant: 'secondary', destructive: true }}>
  Cancel
</Button>

// Link variant supports underline
<Button variant={{ variant: 'link', underline: true }}>
  Learn more
</Button>
```

## CSS Validation & Type Safety

### Compile-time CSS Validation

```tsx
import { css, cssVar, getCSSVar, setCSSVar } from '@re-shell/ui';

// Type-safe CSS object with validation
const styles = css({
  width: '100px',        // Valid
  height: '50rem',       // Valid
  margin: 'auto',        // Valid
  padding: '2em',        // Valid
  color: '#3B82F6',      // Valid
  backgroundColor: 'rgb(59, 130, 246)', // Valid
  // invalid: '123abc',  // Error: Invalid CSS value
});

// CSS Variables with type safety
const primaryColor = cssVar('primary-color');
setCSSVar(primaryColor, '#3B82F6');
const color = getCSSVar(primaryColor);

// Media queries and responsive styles
import { ResponsiveStyle } from '@re-shell/ui';

const responsiveBox: ResponsiveStyle<{ padding: string }> = {
  padding: '1rem',
  '@media (min-width: 768px)': {
    padding: '2rem',
  },
  '@media (prefers-color-scheme: dark)': {
    padding: '1.5rem',
  },
};

// Keyframe animations
import { keyframes } from '@re-shell/ui';

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
  '50%': { opacity: 0.5 },
});
```

## Context System

### Type-Safe Context Creation

```tsx
import { createContext, createCompoundContext, createAsyncContext } from '@re-shell/ui';

// Simple context
const [ThemeProvider, useTheme] = createContext<{ mode: 'light' | 'dark' }>('Theme');

// Compound context with state and actions
interface TodoState {
  todos: string[];
}

interface TodoActions {
  addTodo: (todo: string) => void;
  removeTodo: (index: number) => void;
}

const [TodoProvider, useTodoState, useTodoActions] = createCompoundContext<TodoState, TodoActions>('Todo');

// Async context for loading states
interface User {
  id: string;
  name: string;
}

const [UserProvider, useUserContext, useUserData, useUserLoading, useUserError] = createAsyncContext<User>('User');

// Usage with error boundaries
function App() {
  return (
    <ThemeProvider value={{ mode: 'dark' }}>
      <TodoProvider value={{ 
        state: { todos: [] }, 
        actions: { 
          addTodo: () => {}, 
          removeTodo: () => {} 
        } 
      }}>
        <UserProvider value={{ status: 'loading' }}>
          <MyComponent />
        </UserProvider>
      </TodoProvider>
    </ThemeProvider>
  );
}

// Multi-provider composer
import { composeProviders } from '@re-shell/ui';

const AppProviders = composeProviders(
  ThemeProvider,
  TodoProvider,
  UserProvider
);

function App() {
  return (
    <AppProviders>
      <MyComponent />
    </AppProviders>
  );
}
```

## Design Tokens

### Type Generation from Design Tokens

```tsx
import { 
  DesignTokens, 
  TokenTypeGenerator, 
  TokenTransformer,
  createTokenGetter 
} from '@re-shell/ui';

// Define your design tokens
const tokens: DesignTokens = {
  colors: {
    'primary.500': { 
      name: 'primary.500', 
      value: '#3B82F6', 
      type: 'color' 
    },
    'gray.100': { 
      name: 'gray.100', 
      value: '#F3F4F6', 
      type: 'color' 
    },
  },
  spacing: {
    sm: { name: 'sm', value: '0.5rem', type: 'spacing' },
    md: { name: 'md', value: '1rem', type: 'spacing' },
    lg: { name: 'lg', value: '1.5rem', type: 'spacing' },
  },
  typography: {
    body: {
      name: 'body',
      value: {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      type: 'typography',
    },
  },
  shadows: {
    sm: { 
      name: 'sm', 
      value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
      type: 'shadow' 
    },
  },
  radii: {
    md: { name: 'md', value: '0.375rem', type: 'radius' },
  },
  animations: {
    fast: {
      name: 'fast',
      value: { duration: '150ms', easing: 'ease-out' },
      type: 'animation',
    },
  },
};

// Generate TypeScript types
const types = TokenTypeGenerator.generateThemeType(tokens);

// Transform to theme object
const theme = TokenTransformer.tokensToTheme(tokens);

// Type-safe token getter
const getToken = createTokenGetter(tokens);
const primaryColor = getToken.color('primary.500'); // Type-safe!
const spacing = getToken.spacing('md');            // Type-safe!
```

### Prop Spreading Utilities

```tsx
import { splitProps, mergeProps, getPropGetter } from '@re-shell/ui';

// Split component props from HTML props
function MyButton(props: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [componentProps, htmlProps] = splitProps(props, ['variant', 'size', 'loading']);
  
  return (
    <button {...htmlProps} className={getClassName(componentProps)}>
      {props.children}
    </button>
  );
}

// Merge props with proper precedence
const mergedProps = mergeProps(
  defaultProps,
  userProps,
  { className: 'additional-class' }
);

// Get prop getter for compound components
function useAccordion() {
  const getTriggerProps = getPropGetter({
    onClick: handleToggle,
    'aria-expanded': isExpanded,
  });
  
  return {
    getTriggerProps,
  };
}
```

## Polymorphic Components

### Button as Different Elements

```tsx
import { Button } from '@re-shell/ui';

// Render as a link
<Button as="a" href="/home" target="_blank">
  Go Home
</Button>

// Render as a div (for special cases)
<Button as="div" role="button" tabIndex={0}>
  Custom Element
</Button>

// Type-safe props based on element type
<Button as="a" href="/about" download="file.pdf">
  Download
</Button>

// TypeScript ensures only valid props for the element type
<Button as="a" type="submit">
  Submit
</Button>
// TypeScript Error: Property 'type' does not exist on type 'a'
```

### Creating Custom Polymorphic Components

```tsx
import { PolymorphicComponent, PolymorphicComponentPropWithRef } from '@re-shell/ui';

// Define your component's own props
interface TextOwnProps {
  variant?: 'body' | 'heading' | 'caption';
  color?: 'primary' | 'secondary' | 'muted';
}

// Create the component with polymorphic support
type TextProps<E extends React.ElementType> = PolymorphicComponentPropWithRef<E, TextOwnProps>;

const Text = React.forwardRef(function Text<E extends React.ElementType = 'span'>(
  props: TextProps<E>,
  ref: React.Ref<Element>
) {
  const { as, variant = 'body', color = 'primary', ...rest } = props;
  const Component = as || 'span';
  
  return <Component ref={ref} className={getClassName(variant, color)} {...rest} />;
}) as PolymorphicComponent<TextOwnProps, 'span'>;

// Usage
<Text as="h1" variant="heading">Hello World</Text>
<Text as="p" variant="body">This is a paragraph</Text>
<Text as="small" variant="caption" color="muted">Small text</Text>
```

## Component Variants

### Input Variants with Type-Specific Props

```tsx
import { Input, InputVariant } from '@re-shell/ui';

// Number input with min/max
<Input
  type="number"
  min={0}
  max={100}
  step={5}
  label="Quantity"
/>

// Email input with multiple addresses
<Input
  type="email"
  multiple={true}
  label="Email Addresses"
/>

// Password input with strength meter
<Input
  type="password"
  showToggle={true}
  strengthMeter={true}
  label="Password"
/>

// Search input with suggestions
<Input
  type="search"
  suggestions={['React', 'Re-Shell', 'TypeScript']}
  label="Search"
/>

// Type-safe props - TypeScript prevents invalid combinations
<Input
  type="text"
  min={0} // Error: 'min' does not exist when type is 'text'
/>
```

### Layout Variants

```tsx
import { Layout, LayoutVariant } from '@re-shell/ui';

// Stack layout
<Layout
  type="stack"
  spacing="md"
  align="center"
>
  <div>Item 1</div>
  <div>Item 2</div>
</Layout>

// Grid layout
<Layout
  type="grid"
  columns={3}
  gap="lg"
>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</Layout>

// Container layout
<Layout
  type="container"
  maxWidth="xl"
  padding="md"
>
  <Content />
</Layout>
```

## Theme Customization

### Using Theme Types

```tsx
import { Theme, ThemeOverride, TokenPath, TokenValue } from '@re-shell/ui';

// Type-safe theme customization
const customTheme: ThemeOverride = {
  colors: {
    palettes: {
      primary: {
        500: '#3B82F6',
        600: '#2563EB',
        700: '#1D4ED8',
      }
    },
    semantic: {
      primary: '#3B82F6',
      primaryForeground: '#FFFFFF',
    }
  },
  spacing: {
    4: '1rem',
    8: '2rem',
  },
  typography: {
    fontSizes: {
      base: '16px',
      lg: '18px',
    }
  }
};

// Type-safe token access
type ColorToken = TokenPath<Theme['colors']>;
// ColorToken = "palettes.primary.50" | "palettes.primary.100" | ... | "semantic.background" | ...

type SpacingValue = TokenValue<Theme, 'spacing.4'>;
// SpacingValue = CSSLength

// Use in a theme provider
<ThemeProvider theme={customTheme}>
  <App />
</ThemeProvider>
```

### Responsive Props

```tsx
import { Button, Card } from '@re-shell/ui';

// Responsive sizing
<Button
  size={{
    base: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  }}
>
  Responsive Button
</Button>

// Responsive spacing
<Card
  p={{ base: 2, md: 4, lg: 6 }}
  m={{ base: 1, md: 2 }}
>
  <CardBody>
    Responsive spacing
  </CardBody>
</Card>

// Responsive display
<Box
  display={{ base: 'block', lg: 'flex' }}
  width={{ base: '100%', md: '50%', lg: '33.333%' }}
>
  Responsive layout
</Box>
```

## Advanced Patterns

### Compound Components with Shared State

```tsx
import { createContext, useContext } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@re-shell/ui';

// Create a compound component with shared state
const AccordionContext = createContext<{
  expanded: string[];
  toggle: (id: string) => void;
} | null>(null);

function Accordion({ children, defaultExpanded = [] }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const toggle = (id: string) => {
    setExpanded(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };
  
  return (
    <AccordionContext.Provider value={{ expanded, toggle }}>
      <div className="space-y-2">{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({ id, title, children }) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');
  
  const { expanded, toggle } = context;
  const isExpanded = expanded.includes(id);
  
  return (
    <Card>
      <CardHeader 
        onClick={() => toggle(id)}
        className="cursor-pointer"
      >
        <div className="flex justify-between items-center">
          {title}
          <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} />
        </div>
      </CardHeader>
      {isExpanded && (
        <CardBody>{children}</CardBody>
      )}
    </Card>
  );
}

// Usage
<Accordion defaultExpanded={['item1']}>
  <AccordionItem id="item1" title="Section 1">
    Content for section 1
  </AccordionItem>
  <AccordionItem id="item2" title="Section 2">
    Content for section 2
  </AccordionItem>
</Accordion>
```

### Type-Safe Form Builder

```tsx
import { Input, Select, Checkbox, Form } from '@re-shell/ui';

// Define form schema with types
interface FormSchema {
  fields: {
    name: { type: 'text'; required: true };
    age: { type: 'number'; min: 0; max: 120 };
    email: { type: 'email'; required: true };
    country: { type: 'select'; options: string[] };
    terms: { type: 'checkbox'; required: true };
  };
}

// Type-safe form builder
function buildForm<T extends FormSchema>(schema: T) {
  return {
    renderField(name: keyof T['fields']) {
      const field = schema.fields[name];
      
      switch (field.type) {
        case 'text':
        case 'email':
          return <Input type={field.type} required={field.required} />;
        
        case 'number':
          return <Input type="number" min={field.min} max={field.max} />;
        
        case 'select':
          return <Select options={field.options.map(opt => ({ value: opt, label: opt }))} />;
        
        case 'checkbox':
          return <Checkbox required={field.required} />;
      }
    }
  };
}

// Usage
const form = buildForm({
  fields: {
    name: { type: 'text', required: true },
    age: { type: 'number', min: 18, max: 100 },
    email: { type: 'email', required: true },
    country: { type: 'select', options: ['US', 'UK', 'CA'] },
    terms: { type: 'checkbox', required: true }
  }
});

// Render fields with full type safety
<Form>
  {form.renderField('name')}
  {form.renderField('age')}
  {form.renderField('email')}
  {form.renderField('country')}
  {form.renderField('terms')}
</Form>
```

### Custom Hooks with Type Safety

```tsx
import { useState, useCallback } from 'react';
import { ExclusiveProps, RequiredIf } from '@re-shell/ui';

// Type-safe toggle hook
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return [value, { toggle, setTrue, setFalse }] as const;
}

// Type-safe async state hook
type AsyncState<T> =
  | { status: 'idle'; data?: never; error?: never }
  | { status: 'loading'; data?: never; error?: never }
  | { status: 'success'; data: T; error?: never }
  | { status: 'error'; data?: never; error: Error };

function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  
  const execute = useCallback(async (promise: Promise<T>) => {
    setState({ status: 'loading' });
    try {
      const data = await promise;
      setState({ status: 'success', data });
    } catch (error) {
      setState({ status: 'error', error: error as Error });
    }
  }, []);
  
  return { ...state, execute };
}

// Usage
const [isOpen, { toggle, setTrue: open, setFalse: close }] = useToggle();
const { status, data, error, execute } = useAsync<User[]>();

// Type-safe state checks
if (status === 'success') {
  console.log(data); // TypeScript knows data is User[]
}
if (status === 'error') {
  console.error(error); // TypeScript knows error is Error
}
```

## Testing Examples

### Unit Testing with Vitest

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@re-shell/ui';

describe('Button Component', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('is accessible', () => {
    const { container } = render(<Button>Accessible Button</Button>);
    expect(container.firstChild).toBeAccessible();
  });
});
```

### Visual Regression Testing

```ts
import { test, expect } from '@playwright/test';
import { testInViewports, testThemeVariations } from './visual-test-utils';

test.describe('Button Visual Tests', () => {
  test('renders consistently across browsers', async ({ page }) => {
    await page.goto('/components/button');
    await expect(page.locator('button')).toHaveScreenshot('button-default.png');
  });
  
  test('responsive behavior', async ({ page }) => {
    await testInViewports(page, '/components/button', ['mobile', 'tablet', 'desktop']);
  });
  
  test('theme variations', async ({ page }) => {
    await testThemeVariations(page, ['light', 'dark', 'high-contrast']);
  });
});
```

### Interaction Testing

```tsx
import { createInteractionTest, testKeyboardFlow } from './interaction-test-utils';

describe('Form Interaction', () => {
  it('supports keyboard navigation', async () => {
    const { container } = render(
      <form>
        <Input name="email" />
        <Input name="password" type="password" />
        <Button type="submit">Submit</Button>
      </form>
    );
    
    await testKeyboardFlow(container, [
      'input[name="email"]',
      'input[name="password"]',
      'button[type="submit"]'
    ]);
  });
  
  it('handles complex interactions', async () => {
    const scenario = new InteractionScenario(container);
    
    await scenario
      .addStep('Fill email', async () => {
        await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      })
      .addStep('Submit form', async () => {
        await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
      })
      .verify('Form submitted', () => {
        expect(handleSubmit).toHaveBeenCalled();
      })
      .run();
  });
});
```

### Accessibility Testing

```tsx
import { a11y, componentA11y } from './accessibility';

describe('Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(<Card>Content</Card>);
    
    await a11y.checkA11y(container, {
      rules: wcagLevels.AA.rules,
      detailedReport: true
    });
  });
  
  it('button is fully accessible', async () => {
    render(<Button>Click me</Button>);
    await componentA11y.button(document.body, 'button');
  });
  
  it('has proper focus indicators', async () => {
    const { container } = render(<Button>Focus me</Button>);
    await a11y.checkFocusIndicators(container, 'button');
  });
});
```

### Performance Testing

```tsx
import { PerformanceTestHarness, measureRenderPerformance } from './performance-test-utils';

describe('Performance', () => {
  it('renders within budget', async () => {
    const harness = new PerformanceTestHarness();
    
    harness.start();
    render(<Button>Test</Button>);
    harness.stop();
    
    harness.assertPerformance({
      renderTime: 10,
      totalTime: 20,
      memoryUsage: { delta: 1024 * 1024 }
    });
  });
  
  it('handles stress test', async () => {
    const metrics = await stressTest(Button, {
      instances: 1000,
      updates: 100,
      props: { children: 'Stress Test' }
    });
    
    expect(metrics.totalTime).toBeLessThan(1000);
  });
});
```

### Test Data Generation

```tsx
import { generateUser, generateFormData, edgeCases } from './test-data-generator';

describe('Component with generated data', () => {
  it('handles random user data', () => {
    const users = generateArray(generateUser, 100);
    
    render(<UserList users={users} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(100);
  });
  
  it('handles edge cases', () => {
    Object.values(edgeCases.strings).forEach(str => {
      const { container } = render(<Input value={str} />);
      expect(container.querySelector('input')).toHaveValue(str);
    });
  });
});
```

### Cross-Browser Testing

```ts
import { CrossBrowserTestRunner } from './cross-browser/matrix.config';

describe('Cross-Browser Compatibility', () => {
  const runner = new CrossBrowserTestRunner();
  
  beforeAll(async () => {
    await runner.setup({
      browsers: ['chromium', 'firefox', 'webkit'],
      viewport: { width: 1280, height: 720 },
    });
  });
  
  it('renders consistently across browsers', async () => {
    const results = await runner.runTest(async (page, browserName) => {
      await page.goto('/components/button');
      const button = await page.locator('button');
      expect(button).toBeVisible();
    });
    
    results.forEach((result, browser) => {
      expect(result.success).toBe(true);
    });
  });
});
```

### Mobile Device Testing

```ts
import { MobileGestures, testTouchInteractions } from './mobile/mobile-test-utils';

describe('Mobile Interactions', () => {
  it('handles swipe gestures', async () => {
    const gestures = new MobileGestures(page);
    
    await gestures.swipe('left', { distance: 200 });
    expect(await page.locator('.next-panel')).toBeVisible();
    
    await gestures.pinch(0.5);
    expect(await page.locator('.zoomed-out')).toBeVisible();
  });
  
  it('validates touch targets', async () => {
    const { touchTargets, passed } = await checkMobileAccessibility(page);
    expect(passed).toBe(true);
    expect(touchTargets).toHaveLength(0);
  });
});
```

### Stress Testing

```ts
import { StressTestRunner, stressScenarios } from './stress/stress-test-suite';

describe('Component Stress Tests', () => {
  const runner = new StressTestRunner();
  
  it('handles thousands of instances', async () => {
    const result = await runner.runScenario({
      name: 'Heavy Load',
      instances: 1000,
      updates: 50,
      props: { children: 'Stress Test' },
      threshold: { maxTime: 5000, maxMemory: 200 * 1024 * 1024 }
    }, Button);
    
    expect(result.passed).toBe(true);
    expect(result.avgTimePerRender).toBeLessThan(5);
  });
});
```

### Mutation Testing

```bash
# Run mutation testing
pnpm test:mutation

# View mutation report
open test-results/mutation/index.html
```

Configuration in `stryker.config.mjs`:
```js
export default {
  testRunner: 'vitest',
  mutate: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  thresholds: { high: 80, low: 60 },
  reporters: ['html', 'clear-text', 'progress'],
};
```

## Best Practices

1. **Use Branded Types**: Leverage branded types for CSS values to catch errors at compile time
2. **Embrace Discriminated Unions**: Use variant objects instead of string unions for better type safety
3. **Leverage Conditional Types**: Let TypeScript enforce valid prop combinations
4. **Build Polymorphic Components**: Create flexible components that can render as any element
5. **Type Your Themes**: Use the theme type system for consistent, type-safe styling
6. **Create Type-Safe Patterns**: Build reusable patterns with full type inference
7. **Test Comprehensively**: Use all testing tools - unit, visual, interaction, a11y, and performance
8. **Automate Testing**: Integrate tests into CI/CD pipeline for continuous quality assurance

These examples demonstrate the power of Re-Shell UI's advanced type system. For more examples and patterns, check out our [Storybook](https://re-shell-ui.netlify.app) or [GitHub repository](https://github.com/Re-Shell/reshell-monorepo).