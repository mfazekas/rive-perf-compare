#!/usr/bin/env node
/**
 * Postinstall fixups so the two Rive libraries can coexist in one iOS app.
 *
 * 1. RiveRuntime version: both libs depend on the `RiveRuntime` CocoaPod but pin
 *    different default versions (nitro 6.20.4, legacy 6.18.2) → `pod install`
 *    version conflict. Newer RiveRuntime keeps the older APIs legacy uses, so we
 *    pin legacy UP to nitro's version via the override file its podspec reads.
 *
 * 2. RCTSwiftLog symbol clash: both libs vendor an identical `RCTSwiftLog` ObjC
 *    class → "duplicate symbol" at link time. We rename the legacy copy to
 *    `RiveLegacySwiftLog` (class + Swift call sites; filenames/imports untouched).
 *
 * Idempotent; runs on postinstall so it survives reinstalls.
 */
const fs = require('fs');
const path = require('path');

const LEGACY_IOS = path.join(
  __dirname,
  '..',
  'node_modules',
  'rive-react-native',
  'ios'
);

function pinRiveRuntime() {
  const nitroPkg = require('@rive-app/react-native/package.json');
  const target = nitroPkg.runtimeVersions && nitroPkg.runtimeVersions.ios;
  if (!target) {
    console.warn('[pin-rive-runtime] could not read nitro iOS runtime version; skipping');
    return;
  }

  if (!fs.existsSync(LEGACY_IOS)) {
    console.warn('[fixups] legacy ios dir not found; skipping runtime pin');
    return;
  }

  const file = path.join(LEGACY_IOS, 'Podfile.properties.json');
  const contents = { RiveRuntimeIOSVersion: target };
  fs.writeFileSync(file, JSON.stringify(contents, null, 2) + '\n');
  console.log(`[fixups] pinned legacy RiveRuntime iOS -> ${target}`);
}

function renameLegacySwiftLog() {
  if (!fs.existsSync(LEGACY_IOS)) return;
  // Only the ObjC class symbol is renamed; #import "RCTSwiftLog.h" filenames stay.
  const edits = [
    ['RCTSwiftLog.h', /@interface RCTSwiftLog\b/g, '@interface RiveLegacySwiftLog'],
    ['RCTSwiftLog.m', /@implementation RCTSwiftLog\b/g, '@implementation RiveLegacySwiftLog'],
    ['RCTLog.swift', /RCTSwiftLog\./g, 'RiveLegacySwiftLog.'],
    ['RiveReactNativeViewManager.swift', /RCTSwiftLog\./g, 'RiveLegacySwiftLog.'],
  ];
  let changed = 0;
  for (const [name, pattern, replacement] of edits) {
    const file = path.join(LEGACY_IOS, name);
    if (!fs.existsSync(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    if (!pattern.test(src)) continue;
    fs.writeFileSync(file, src.replace(pattern, replacement));
    changed++;
  }
  if (changed) console.log(`[fixups] renamed legacy RCTSwiftLog -> RiveLegacySwiftLog (${changed} files)`);
}

function main() {
  pinRiveRuntime();
  renameLegacySwiftLog();
}

main();
