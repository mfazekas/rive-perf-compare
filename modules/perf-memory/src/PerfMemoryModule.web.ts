import { registerWebModule, NativeModule } from 'expo';

class PerfMemoryModule extends NativeModule<{}> {
  memoryFootprint(): number {
    const used = (globalThis.performance as any)?.memory?.usedJSHeapSize;
    return typeof used === 'number' ? used : 0;
  }
  mallocInUse(): number {
    const used = (globalThis.performance as any)?.memory?.usedJSHeapSize;
    return typeof used === 'number' ? used : 0;
  }
}

export default registerWebModule(PerfMemoryModule, 'PerfMemoryModule');
