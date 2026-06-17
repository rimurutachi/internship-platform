import { renderHook } from "@testing-library/react";

// We need to mock the hook's matchMedia dependency
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

// Import AFTER mocking
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  it("should return false for desktop viewport", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
