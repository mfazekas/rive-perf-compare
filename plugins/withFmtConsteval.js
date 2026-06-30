const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// fmt 11.0.2 (vendored by React Native) fails to compile its own source under Apple clang 21
// (Xcode 26): the consteval `FMT_STRING(...)` call sites in format-inl.h aren't constant
// expressions, which clang 21 now rejects (fmtlib/fmt#4740). fmt only enables consteval at
// C++20+, so we build *only* the fmt pod as C++17 — it falls back to runtime format-string
// validation. Consumers (folly/glog) pass constant strings, so they're unaffected.
//
// This lives in a config plugin (not a hand-edited Podfile) so it survives `expo prebuild`,
// which regenerates ios/Podfile from the template.

const MARKER = 'fmt-consteval-cpp17';
const SNIPPET = `
    # ${MARKER}: fmt 11.0.2 won't compile under Apple clang 21 / Xcode 26 (fmtlib/fmt#4740) —
    # build only the fmt pod as C++17 so it skips the broken consteval format-string path.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'fmt'
      target.build_configurations.each do |cfg|
        cfg.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
      end
    end
`;

module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let src = fs.readFileSync(podfile, 'utf8');
      if (src.includes(MARKER)) return cfg; // idempotent

      const anchor = /(post_install do \|installer\|\n)/;
      if (!anchor.test(src)) {
        console.warn('[withFmtConsteval] no post_install hook found in Podfile; skipping');
        return cfg;
      }
      src = src.replace(anchor, `$1${SNIPPET}`);
      fs.writeFileSync(podfile, src);
      return cfg;
    },
  ]);
};
