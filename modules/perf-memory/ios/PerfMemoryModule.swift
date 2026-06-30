import ExpoModulesCore

public class PerfMemoryModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PerfMemory")

    // Physical memory footprint in bytes. This is the same metric Xcode's
    // memory gauge reports (task_vm_info.phys_footprint) and the closest
    // proxy to what iOS uses for jetsam/memory-pressure decisions.
    Function("memoryFootprint") { () -> Double in
      var info = task_vm_info_data_t()
      var count = mach_msg_type_number_t(
        MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<integer_t>.size)
      let result = withUnsafeMutablePointer(to: &info) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
          task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), $0, &count)
        }
      }
      guard result == KERN_SUCCESS else { return -1 }
      return Double(info.phys_footprint)
    }

    // Live heap currently allocated by malloc across all zones, in bytes.
    // Unlike phys_footprint, this DROPS immediately when memory is free()'d —
    // the same signal Xcode Instruments "Allocations" shows. Best metric for
    // observing deterministic (eager) release. Note: GPU/Metal texture memory
    // is allocated outside malloc, so it isn't counted here.
    Function("mallocInUse") { () -> Double in
      var stats = malloc_statistics_t()
      malloc_zone_statistics(nil, &stats)
      return Double(stats.size_in_use)
    }
  }
}
