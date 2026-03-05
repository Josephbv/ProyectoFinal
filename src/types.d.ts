// Ambient declarations for modules without types
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function useState<T = undefined>(): [T | undefined, (value: T | ((prev: T) => T) | undefined) => void];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useEffect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useCallback: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useMemo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useRef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useReducer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useLayoutEffect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useId: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Fragment: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Component: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const PureComponent: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const memo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const forwardRef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createRef: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createContext: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createElement: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const cloneElement: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const createPortal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const findDOMNode: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const unmountComponentAtNode: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const render: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const hydrate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const flushSync: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const unstable_batchedUpdates: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const StrictMode: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const Suspense: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const lazy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const startTransition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const unstable_startTransition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useTransition: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useDeferredValue: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useSyncExternalStore: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useInsertionEffect: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useImperativeHandle: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const useDebugValue: any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom' {
  export const render: any;
  export const hydrate: any;
  export const unmountComponentAtNode: any;
  export const findDOMNode: any;
  export const createPortal: any;
  export const flushSync: any;
  export const unstable_batchedUpdates: any;
  export const StrictMode: any;
  export const Suspense: any;
  export const lazy: any;
  export const createRoot: any;
  export const hydrateRoot: any;
}

declare module 'react-dom/client' {
  export const createRoot: any;
  export const hydrateRoot: any;
}

declare module 'react-dom/server' {
  export const renderToString: any;
  export const renderToStaticMarkup: any;
  export const renderToNodeStream: any;
  export const renderToStaticNodeStream: any;
}

declare module 'lucide-react' {
  const ShoppingCart: any;
  const Calendar: any;
  const User: any;
  const DollarSign: any;
  const CreditCard: any;
  const FileText: any;
  const Stethoscope: any;
  const Package: any;
  const Calculator: any;
  const CheckCircle2: any;
  const X: any;
  const Plus: any;
  
  export {
    ShoppingCart,
    Calendar,
    User,
    DollarSign,
    CreditCard,
    FileText,
    Stethoscope,
    Package,
    Calculator,
    CheckCircle2,
    X,
    Plus
  };
}
