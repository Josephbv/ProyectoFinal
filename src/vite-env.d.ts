/// <reference types="vite/client" />

// Declare React module
declare module 'react' {
  interface ReactNode {
    // Basic React node type
  }
}

// Allow implicit any for event handlers
declare global {
  function setTimeout(callback: () => void, delay: number): number;
}

// Export empty object to make this a module
export {};
