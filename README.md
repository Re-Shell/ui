# @re-shell/ui

A comprehensive, accessible, and customizable React component library for the Re-Shell microfrontend framework. Built with TypeScript and modern web standards.

**Current Version**: 0.4.0 - 🎉 Foundation Phase Complete! World-class TypeScript type system and comprehensive testing infrastructure with 85 tasks completed.

## 🌟 Overview

`@re-shell/ui` is a production-ready component library specifically designed for microfrontend architectures. It provides a consistent design system and user experience across all your microfrontends while maintaining flexibility and customization options.

### Why Choose Re-Shell UI?

- **🎯 Microfrontend Optimized**: Designed specifically for distributed frontend architectures
- **🔄 Framework Agnostic**: While built for React, integrates seamlessly with other frameworks via Re-Shell Core
- **📦 Modular Design**: Tree-shakeable components to minimize bundle size impact
- **🎨 Design System**: Consistent styling and behavior across your entire application
- **♿ Accessibility First**: WCAG 2.1 AA compliant with comprehensive screen reader support
- **🚀 Developer Experience**: Rich TypeScript support with IntelliSense and auto-completion

## ✨ Features

### Core Capabilities
- 🎨 **22+ Production-Ready Components** - From basic buttons to complex data tables
- 🔧 **Highly Customizable** - Multiple variants, sizes, and styling options
- ♿ **Accessibility First** - WCAG 2.1 AA compliant with proper ARIA attributes
- 🎯 **Advanced TypeScript System** - World-class type safety with polymorphic components
- 🔀 **Polymorphic Components** - Components that can render as any HTML element
- 🎭 **Discriminated Unions** - Type-safe variant system with compile-time guarantees
- 🏷️ **Branded Types** - Type-safe CSS units and values
- 📱 **Responsive Design** - Mobile-first approach with responsive utilities
- 🚀 **Performance Optimized** - Tree-shakeable with minimal bundle impact
- 🧪 **Well Tested** - Comprehensive test coverage with automated testing

### Microfrontend-Specific Features
- 🔗 **Cross-MF Communication** - Shared state management between microfrontends
- 🏗️ **Module Federation Support** - Built-in support for Webpack Module Federation
- 🛡️ **Error Boundaries** - Robust error handling and fallback UI
- 🔄 **Dynamic Loading** - Lazy loading and code splitting support
- 📡 **Event-Driven Architecture** - Inter-microfrontend communication patterns
- 🎛️ **Feature Flags** - A/B testing and feature toggling capabilities

## 🏆 Version 0.4.0 Achievements

### Foundation Phase Complete ✅

We've successfully completed the foundation phase with 85 tasks, establishing Re-Shell UI as a world-class component library:

#### 🔥 Advanced TypeScript System
- **Polymorphic Components**: Components that adapt their types based on the `as` prop
- **Discriminated Unions**: Type-safe variant system with compile-time guarantees
- **Branded Types**: Type-safe CSS units (px, rem, %) and color values
- **Template Literal Types**: Dynamic prop generation with full IntelliSense
- **Conditional Types**: Smart prop dependencies and relationships

#### 🧪 Comprehensive Testing
- **42+ Tests**: Covering all aspects of functionality
- **Property-Based Testing**: Automated edge case discovery with fast-check
- **Visual Regression**: Pixel-perfect UI consistency with Playwright
- **Performance Testing**: Ensuring components stay fast
- **Accessibility Testing**: Automated WCAG compliance checks

#### 🚀 Build & Distribution
- **Multiple Formats**: ESM, CJS, and UMD bundles
- **Tree-Shakeable**: Import only what you need
- **Optimized Bundles**: Minimal size with maximum functionality
- **Type Definitions**: Full TypeScript support out of the box

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

- **Input** - Enhanced text input with icons, validation, error states, and helper text
- **Textarea** - Multi-line text input with auto-resize, character count, and validation
- **Checkbox** - Customizable checkbox with indeterminate state and custom icons
- **Radio & RadioGroup** - Radio buttons with group management and validation
- **Select** - Advanced dropdown select with search, multi-select, and custom options
- **Switch** - Toggle switch with smooth animations and custom labels

### 🏗️ Layout Components

- **Card** - Flexible card container with header, body, and footer
- **Divider** - Horizontal and vertical dividers with labels

### 🎭 Overlay Components

- **Modal** - Accessible modal with focus management, backdrop control, and size variants
- **Tooltip** - Smart positioning tooltip with multiple triggers and custom content
- **Dropdown** - Feature-rich dropdown menu with keyboard navigation and custom positioning

### 💬 Feedback Components

- **Alert** - Contextual alerts with icons, dismissible options, and action buttons
- **Spinner** - Loading indicators with multiple animations and size options
- **Progress** - Progress bars with labels, animations, and indeterminate states

### 📊 Data Display Components

- **Badge** - Status indicators, notification badges, and labels with custom colors
- **Avatar & AvatarGroup** - User avatars with fallbacks, grouping, and status indicators
- **Tabs** - Tabbed interface with multiple variants and keyboard navigation
- **Accordion** - Collapsible content sections with smooth animations

### 🧭 Navigation Components

- **Breadcrumb** - Navigation breadcrumbs with overflow handling and custom separators
- **Pagination** - Advanced page navigation with customizable display and jump-to-page

## 🎨 Styling & Theming

All components are built with Tailwind CSS and provide extensive customization options:

### Design System
- **Color Variants**: `primary`, `secondary`, `success`, `warning`, `error`, `info`
- **Size Scale**: `xs`, `sm`, `md`, `lg`, `xl`, `2xl` with consistent spacing
- **Shape Options**: `rounded`, `pill`, `square`, `circle` for flexible design
- **Custom Classes**: Override any style with the `className` prop
- **CSS Variables**: Use CSS custom properties for theme customization

### Theming Example
```tsx
<Button 
  variant="primary" 
  size="lg" 
  shape="pill" 
  className="custom-button-class"
  style={{ '--button-bg': '#custom-color' }}
>
  Custom Styled Button
</Button>
```

### Dark Mode Support
All components support dark mode through CSS variables and Tailwind's dark mode classes:

```tsx
<div className="dark">
  <Card className="bg-gray-800 text-white">
    <CardBody>
      <Alert variant="success" className="dark:bg-green-900">
        Dark mode compatible alert
      </Alert>
    </CardBody>
  </Card>
</div>
```

## ♿ Accessibility

Every component follows accessibility best practices:

- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels and roles
- **Focus Management** - Logical focus flow
- **Color Contrast** - WCAG AA compliant colors
- **Semantic HTML** - Proper HTML structure

## 📖 Component Examples

### Enhanced Button with All Features

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
  className="w-full md:w-auto"
>
  Add Item
</Button>
```

### Complete Form with Validation

```tsx
function ContactForm() {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    newsletter: false,
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});

  return (
    <Card>
      <CardHeader>
        <h2>Contact Us</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          leftIcon="mail"
          error={!!errors.email}
          errorMessage={errors.email}
          helperText="We'll never share your email with anyone"
          required
        />

        <Textarea
          label="Message"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          placeholder="Tell us how we can help..."
          rows={4}
          maxLength={500}
          showCharacterCount
          error={!!errors.message}
          errorMessage={errors.message}
        />

        <Select
          label="Priority Level"
          value={formData.priority}
          onChange={(value) => setFormData({...formData, priority: value})}
          options={[
            { value: 'low', label: 'Low Priority' },
            { value: 'medium', label: 'Medium Priority' },
            { value: 'high', label: 'High Priority' },
            { value: 'urgent', label: 'Urgent' }
          ]}
        />

        <Switch 
          label="Subscribe to newsletter" 
          checked={formData.newsletter} 
          onChange={(checked) => setFormData({...formData, newsletter: checked})}
          helperText="Get updates about new features and releases"
        />

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Send Message
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
```

### Microfrontend Integration Example

```tsx
import { 
  MicrofrontendContainer, 
  SharedStateProvider, 
  NavigationShell,
  ErrorBoundary 
} from '@re-shell/ui';

function ShellApplication() {
  return (
    <SharedStateProvider>
      <NavigationShell>
        <ErrorBoundary fallback={<Alert variant="error">Something went wrong</Alert>}>
          <MicrofrontendContainer
            name="user-dashboard"
            url="/microfrontends/dashboard.js"
            fallback={<Spinner size="lg" />}
            onError={(error) => console.error('MF Load Error:', error)}
          />
        </ErrorBoundary>
      </NavigationShell>
    </SharedStateProvider>
  );
}
```

### Data Display with Advanced Features

```tsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2>Team Members</h2>
          <Badge variant="primary">{users.length} members</Badge>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar 
                  src={user.avatar} 
                  name={user.name}
                  size="md"
                  status={user.online ? 'online' : 'offline'}
                />
                <div className="flex-1">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.role}</div>
                </div>
                <Badge 
                  variant={user.active ? 'success' : 'secondary'}
                  size="sm"
                >
                  {user.active ? 'Active' : 'Inactive'}
                </Badge>
                <Dropdown
                  trigger={<Button variant="ghost" size="sm" leftIcon="moreVertical" />}
                  items={[
                    { label: 'View Profile', action: () => viewProfile(user.id) },
                    { label: 'Send Message', action: () => sendMessage(user.id) },
                    { label: 'Remove', action: () => removeUser(user.id), variant: 'danger' }
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
```

## 🔧 Development

### Setup
```bash
# Install dependencies
pnpm install

# Start development server with hot reloading
pnpm run dev

# Build the package for production
pnpm run build

# Run tests with coverage
pnpm run test

# Run visual regression tests
pnpm playwright test

# Run interaction tests
pnpm test:interaction

# Run performance tests
pnpm test:performance

# Run linting and fix issues
pnpm run lint

# Clean build artifacts
pnpm run clean
```

### Testing Infrastructure

Re-Shell UI includes a world-class testing infrastructure:

- **Unit Testing**: Comprehensive component testing with Vitest
- **Visual Regression**: Playwright-based screenshot comparison across browsers
- **Interaction Testing**: User event simulation and complex interaction scenarios
- **Accessibility Testing**: Automated WCAG compliance checking with axe-core
- **Performance Testing**: Render performance benchmarking and memory profiling
- **Cross-Browser Testing**: Automated testing in Chromium, Firefox, and WebKit
- **Mobile Testing**: Touch gestures, device rotation, and mobile-specific metrics
- **Stress Testing**: Component stress testing with thousands of instances
- **Screenshot Comparison**: Pixel-perfect visual regression with baseline management
- **Mutation Testing**: Code quality validation with Stryker Mutator
- **Property-Based Testing**: Generative testing with fast-check for edge cases
- **Coverage Reporting**: Automated coverage reports with badges and thresholds
- **CI/CD Integration**: Complete GitHub Actions workflow for automated testing
- **Performance Optimization**: Test parallelization and intelligent caching

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test suite
pnpm test button

# Run in watch mode
pnpm test:watch
```

### Development Workflow

1. **Component Development**: Create new components in `/src` with TypeScript
2. **Testing**: Write tests in `/tests` using Vitest and Testing Library
3. **Documentation**: Update README and add inline documentation
4. **Type Safety**: Ensure all props and exports have proper TypeScript types
5. **Accessibility**: Test with screen readers and keyboard navigation

### Project Structure
```
src/
├── components/           # Individual component files
│   ├── Button.tsx       # Component implementation
│   ├── Button.test.tsx  # Component tests
│   └── Button.stories.tsx # Storybook stories
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── hooks/               # Custom React hooks
└── index.ts             # Main export file
```

## 🏗️ Component Architecture

Re-Shell UI follows atomic design principles with a clear component hierarchy optimized for microfrontend architectures:

```
🔹 Atoms (Basic Building Blocks)
   ├── Button - Interactive buttons with variants, states, and loading indicators
   ├── Icon - Comprehensive SVG icon library with 40+ icons
   ├── Badge - Status indicators, notification badges, and labels
   ├── Spinner - Loading indicators with multiple animation styles
   └── Avatar - User avatars with fallbacks and status indicators

🔸 Molecules (Simple Combinations)
   ├── Input - Enhanced text inputs with validation, icons, and helper text
   ├── Checkbox - Checkboxes with labels, states, and custom styling
   ├── Switch - Toggle switches with smooth animations and labels
   ├── Radio & RadioGroup - Radio button groups with validation
   ├── Select - Advanced dropdown selects with search and multi-select
   └── Textarea - Multi-line text inputs with auto-resize and character count

🔶 Organisms (Complex Components)
   ├── Card - Flexible containers with header, body, and footer sections
   ├── Modal - Accessible modals with focus management and backdrop control
   ├── Dropdown - Feature-rich dropdown menus with keyboard navigation
   ├── Tabs - Tabbed interfaces with multiple variants and accessibility
   ├── Accordion - Collapsible content sections with smooth animations
   ├── Alert - Contextual alerts with icons and dismissible options
   ├── Progress - Progress bars with labels and indeterminate states
   ├── Tooltip - Smart positioning tooltips with multiple triggers
   ├── Breadcrumb - Navigation breadcrumbs with overflow handling
   └── Pagination - Advanced page navigation with customizable display

🟦 Templates (Microfrontend-Specific Components)
   ├── NavigationShell - Main navigation framework for shell applications
   ├── MicrofrontendContainer - Wrapper for loading and mounting microfrontends
   ├── SharedStateProvider - Cross-microfrontend state management
   ├── ErrorBoundary - Error handling and fallback UI for microfrontends
   ├── LoadingFallback - Skeleton loaders and loading states
   ├── ModuleFederation - Webpack Module Federation utilities and components
   ├── FeatureFlag - A/B testing and feature toggling components
   └── MicrofrontendRegistry - Registration and discovery of microfrontends
```

### Component Design Principles

1. **Composable**: All components can be combined and nested
2. **Accessible**: WCAG 2.1 AA compliance built-in
3. **Performant**: Tree-shakeable with minimal bundle impact
4. **Flexible**: Extensive customization through props and CSS
5. **Consistent**: Unified design language across all components
6. **Tested**: Comprehensive test coverage for reliability

## 🔗 Related Packages

- **[@re-shell/core](https://github.com/Re-Shell/reshell-monorepo/tree/main/packages/core)** - Core microfrontend framework and utilities
- **[@re-shell/cli](https://github.com/Re-Shell/reshell-monorepo/tree/main/packages/cli)** - Command-line interface for creating and managing Re-Shell projects

## 📖 Documentation

For comprehensive documentation, examples, and guides, visit:

- **[Component Documentation](https://github.com/Re-Shell/reshell-monorepo/tree/main/packages/ui/docs)** - Detailed API documentation for each component
- **[Storybook Examples](https://re-shell-ui.netlify.app)** - Interactive component examples and playground
- **[Design System Guide](https://github.com/Re-Shell/reshell-monorepo/blob/main/docs/design-system.md)** - Design principles and guidelines
- **[Accessibility Guide](https://github.com/Re-Shell/reshell-monorepo/blob/main/docs/accessibility.md)** - WCAG compliance and testing procedures
- **[Migration Guide](https://github.com/Re-Shell/reshell-monorepo/blob/main/docs/ui-migration.md)** - Upgrade instructions between versions
- **[Contributing Guide](https://github.com/Re-Shell/reshell-monorepo/blob/main/packages/ui/CONTRIBUTING.md)** - Component development guidelines

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/Re-Shell/reshell-monorepo/blob/main/CONTRIBUTING.md) for details on:

- **Code of Conduct** - Community guidelines and expectations
- **Development Setup** - Local development environment setup
- **Component Design Guidelines** - Design principles and patterns
- **Testing Requirements** - Unit, integration, and accessibility testing
- **Accessibility Standards** - WCAG compliance requirements
- **Documentation Standards** - JSDoc and README requirements
- **Submitting Pull Requests** - PR guidelines and review process
- **Release Process** - Semantic versioning and changelog maintenance

## 📄 License

MIT License - see [LICENSE](https://github.com/Re-Shell/reshell-monorepo/blob/main/LICENSE) for details.

## 📞 Support

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Re-Shell/reshell-monorepo/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Re-Shell/reshell-monorepo/discussions)
- **📚 Documentation**: [GitHub Wiki](https://github.com/Re-Shell/reshell-monorepo/wiki)
- **🎨 Design System**: [Figma Design Kit](https://figma.com/re-shell-design-system) - Complete design system with components and tokens
- **📧 Email**: [support@re-shell.org](mailto:support@re-shell.org)
