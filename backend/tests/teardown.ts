// Global teardown file
export = async function globalTeardown() {
    // Close any remaining handles
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force garbage collection if available
    if ((global as any).gc) {
        (global as any).gc();
    }
}
