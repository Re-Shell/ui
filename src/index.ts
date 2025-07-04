// UI package exports
export const VERSION = '0.3.1';

// Type System Exports
export * from './types';

// Basic Components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Icon } from './Icon';
export type { IconProps } from './Icon';

// Form Components
export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { default as Radio, RadioGroup } from './Radio';
export type { RadioProps, RadioGroupProps } from './Radio';

export { default as Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { default as Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { default as Switch } from './Switch';
export type { SwitchProps } from './Switch';

// Layout Components
export { default as Card, CardHeader, CardBody, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card';

export { default as Divider } from './Divider';
export type { DividerProps } from './Divider';

// Overlay Components
export { default as Modal } from './Modal';
export type { ModalProps } from './Modal';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { default as Dropdown } from './Dropdown';
export type { DropdownProps, DropdownItem } from './Dropdown';

// Feedback Components
export { default as Alert } from './Alert';
export type { AlertProps } from './Alert';

export { default as Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { default as Progress } from './Progress';
export type { ProgressProps } from './Progress';

// Data Display Components
export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarGroupProps } from './Avatar';

export { default as Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { default as Accordion } from './Accordion';
export type { AccordionProps, AccordionItem } from './Accordion';

// Navigation Components
export { default as Breadcrumb } from './Breadcrumb';
export type { BreadcrumbProps, BreadcrumbItem } from './Breadcrumb';

export { default as Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

// Microfrontend Components
export { default as MicrofrontendContainer } from './MicrofrontendContainer';
export type { MicrofrontendContainerProps, MicrofrontendConfig } from './MicrofrontendContainer';

export { default as ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

export { default as LoadingFallback, SkeletonLoader, CardSkeleton } from './LoadingFallback';
export type { LoadingFallbackProps } from './LoadingFallback';

export { 
  FederatedComponent, 
  FederatedRoute,
  loadFederatedComponent,
  withModuleFederation,
  useFederatedComponent,
  createLazyFederatedComponent
} from './ModuleFederation';
export type { 
  ModuleFederationConfig, 
  FederatedComponentProps, 
  FederatedRouteProps 
} from './ModuleFederation';

export { 
  default as SharedStateProvider,
  useSharedState,
  useSharedEvents,
  useCrossMicrofrontendCommunication
} from './SharedStateProvider';
export type { 
  SharedStateProviderProps,
  SharedStateContextValue,
  SharedStateEvent,
  SharedStateListener
} from './SharedStateProvider';

export {
  default as NavigationShell,
  NavigationLink,
  useNavigation,
  useRouteGuard
} from './NavigationShell';
export type {
  NavigationShellProps,
  NavigationContextValue,
  RouteConfig,
  NavigationOptions,
  RouteGuard,
  NavigationLinkProps
} from './NavigationShell';

export {
  default as FeatureFlagProvider,
  FeatureFlag,
  useFeatureFlag,
  useFeatureFlagVariant,
  withFeatureFlag
} from './FeatureFlag';
export type {
  FeatureFlagProviderProps,
  FeatureFlagProps,
  FeatureFlagConfig,
  FeatureFlagContextValue
} from './FeatureFlag';

export {
  default as MicrofrontendRegistry,
  RegistryStatus,
  useMicrofrontendRegistry,
  useAutoRegister
} from './MicrofrontendRegistry';
export type {
  MicrofrontendRegistryProps,
  MicrofrontendInfo,
  RegistryConfig,
  MicrofrontendRegistryContextValue,
  RegistryStatusProps
} from './MicrofrontendRegistry';
