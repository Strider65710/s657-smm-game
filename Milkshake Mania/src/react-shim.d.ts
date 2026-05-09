declare module "react" {
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export interface MutableRefObject<T> {
    current: T;
  }

  export function useState<S>(
    initialState: S | (() => S),
  ): [S, Dispatch<SetStateAction<S>>];

  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[],
  ): void;

  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: readonly unknown[],
  ): T;

  export function useRef<T>(initialValue: T): MutableRefObject<T>;

  export const Fragment: any;
  export const StrictMode: any;

  const React: any;
  export default React;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react-dom/client" {
  export type Root = {
    render: (node: any) => void;
    unmount: () => void;
  };

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

