const std = @import("std");

pub fn build(b: *std.build.Builder) void {
    const mode = b.standardReleaseOptions();

    // wasm target
    const wasm = std.zig.CrossTarget{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
        .ofmt = .wasm,
    };

    const target = b.standardTargetOptions(.{
        .whitelist = &.{wasm},
        .default_target = wasm,
    });

    const lib = b.addSharedLibrary("index", "src/main.zig", .unversioned);
    lib.addIncludePath("./include");
    lib.setBuildMode(mode);
    lib.setTarget(target);
    lib.install();

    // const main_tests = b.addTest("src/main.zig");
    // main_tests.setBuildMode(mode);

    // const test_step = b.step("test", "Run library tests");
    // test_step.dependOn(&main_tests.step);
}
