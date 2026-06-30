Pod::Spec.new do |s|
  s.name           = 'PerfMemory'
  s.version        = '1.0.0'
  s.summary        = 'Reads the app process physical memory footprint'
  s.description    = 'Local Expo module exposing task_vm_info.phys_footprint for the perf HUD'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
