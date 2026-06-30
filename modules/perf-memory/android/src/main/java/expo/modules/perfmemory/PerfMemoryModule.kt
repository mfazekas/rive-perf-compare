package expo.modules.perfmemory

import android.os.Debug
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PerfMemoryModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PerfMemory")

    // Total PSS (proportional set size) of the process, in bytes. Closest
    // Android analogue to iOS phys_footprint for app-level memory tracking.
    Function("memoryFootprint") {
      val info = Debug.MemoryInfo()
      Debug.getMemoryInfo(info)
      info.totalPss.toLong() * 1024.0
    }

    // Native heap bytes currently allocated. Drops on free(), so it reveals
    // deterministic release (analogue of iOS malloc size_in_use).
    Function("mallocInUse") {
      Debug.getNativeHeapAllocatedSize().toDouble()
    }
  }
}
