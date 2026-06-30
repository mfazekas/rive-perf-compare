import { NativeModule, requireNativeModule } from 'expo';

declare class PerfMemoryModule extends NativeModule<{}> {
  memoryFootprint(): number;
  mallocInUse(): number;
}

export default requireNativeModule<PerfMemoryModule>('PerfMemory');
