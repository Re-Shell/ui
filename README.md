# @re-shell/ui

A comprehensive, accessible, and customizable React component library for the Re-Shell microfrontend framework. Built with TypeScript and Tailwind CSS.

## ✨ Features

- 🎨 **22+ Production-Ready Components** - From basic buttons to complex data tables
- 🔧 **Highly Customizable** - Multiple variants, sizes, and styling options
- ♿ **Accessibility First** - WCAG 2.1 compliant with proper ARIA attributes
- 🎯 **TypeScript Support** - Full type safety with comprehensive interfaces
- 📱 **Responsive Design** - Mobile-first approach with responsive utilities
- 🎭 **Multiple Variants** - Different styles for every use case
- 🚀 **Performance Optimized** - Tree-shakeable with minimal bundle impact
- 🧪 **Well Tested** - Comprehensive test coverage

## 📦 Installation

```bash
npm install @re-shell/ui
# or
yarn add @re-shell/ui
# or
pnpm add @re-shell/ui
```

## 🚀 Quick Start

```tsx
import { Button, Card, CardHeader, CardBody, Input, Alert } from '@re-shell/ui';

function App() {
  return (
    <Card>
      <CardHeader>
        <h2>Welcome to Re-Shell UI</h2>
      </CardHeader>
      <CardBody>
        <Alert variant="success" title="Success!">
          Your component library is ready to use.
        </Alert>

        <Input label="Email" type="email" placeholder="Enter your email" leftIcon="mail" />

        <Button
          variant="primary"
          size="lg"
          leftIcon="check"
          onClick={() => console.log('Clicked!')}
        >
          Get Started
        </Button>
      </CardBody>
    </Card>
  );
}
```

## 📚 Component Categories

### 🔘 Basic Components

- **Button** - Enhanced button with icons, loading states, and multiple variants
- **Icon** - Comprehensive icon library with 40+ SVG icons

### 📝 Form Components

- **Input** - Text input with icons, validation, and multiple variants
- **Textarea** - Multi-line text input with auto-resize and character count
- **Checkbox** - Customizable checkbox with indeterminate state
- **Radio & RadioGroup** - Radio buttons with group management
- **Select** - Dropdown select with search and custom options
- **Switch** - Toggle switch with smooth animations

### 🏗️ Layout Components

- **Card** - Flexible card container with header, body, and footer
- **Divider** - Horizontal and vertical dividers with labels

### 🎭 Overlay Components

- **Modal** - Accessible modal with focus management
- **Tooltip** - Smart positioning tooltip with multiple triggers
- **Dropdown** - Feature-rich dropdown menu with keyboard navigation

### 💬 Feedback Components

- **Alert** - Contextual alerts with icons and dismissible options
- **Spinner** - Loading indicators with multiple animations
- **Progress** - Progress bars with labels and animations

### 📊 Data Display Components

- **Badge** - Status indicators and labels
- **Avatar & AvatarGroup** - User avatars with fallbacks and grouping
- **Tabs** - Tabbed interface with multiple variants
- **Accordion** - Collapsible content sections

### 🧭 Navigation Components

- **Breadcrumb** - Navigation breadcrumbs with overflow handling
- **Pagination** - Page navigation with customizable display

## 🎨 Styling & Theming

All components are built with Tailwind CSS and support:

- **Multiple Variants**: `primary`, `secondary`, `success`, `warning`, `error`
- **Flexible Sizing**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- **Shape Options**: `rounded`, `pill`, `square`, `circle`
- **Custom Classes**: Override styles with `className` prop

```tsx
<Button variant="primary" size="lg" shape="pill" className="custom-button-class">
  Custom Styled Button
</Button>
```

## ♿ Accessibility

Every component follows accessibility best practices:

- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels and roles
- **Focus Management** - Logical focus flow
- **Color Contrast** - WCAG AA compliant colors
- **Semantic HTML** - Proper HTML structure

## 📖 Component Examples

### Enhanced Button

```tsx
<Button
  variant="primary"
  size="md"
  leftIcon="plus"
  rightIcon="chevronDown"
  loading={isLoading}
  disabled={isDisabled}
  tooltip="Add new item"
  onClick={handleClick}
>
  Add Item
</Button>
```

### Form with Validation

```tsx
<form>
  <Input
    label="Email"
    type="email"
    leftIcon="mail"
    error={!!errors.email}
    errorMessage={errors.email}
    helperText="We'll never share your email"
  />

  <Switch label="Subscribe to newsletter" checked={subscribed} onChange={setSubscribed} />

  <Button type="submit" fullWidth>
    Submit
  </Button>
</form>
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build the package
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.
