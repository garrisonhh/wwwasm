const std = @import("std");

const c = @cImport({
    @cInclude("spec.h");
});

export fn alloc(nbytes: usize) ?[*]u8 {
    const slice = std.heap.page_allocator.alloc(u8, nbytes) catch {
        return null;
    };

    return slice.ptr;
}

export fn free(ptr: [*]u8, len: usize) void {
    return std.heap.page_allocator.free(ptr[0..len]);
}

const DEBUG_BUF_SIZE = 1024;

fn debug(comptime fmt: []const u8, args: anytype) void {
    var buf: [DEBUG_BUF_SIZE]u8 = undefined;
    const str = std.fmt.bufPrint(&buf, fmt, args) catch std.fmt.comptimePrint(
        "error: attempted to debug print more than {} bytes.",
        .{DEBUG_BUF_SIZE},
    );

    c.debug(str.ptr, str.len);
}

export fn init() void {
    var sz: @Vector(2, usize) = undefined;
    c.get_window_size(&sz[0], &sz[1]);

    debug("hello, init!\nwindow size: {}\n", .{sz});
}

export fn update(dt_ms: u32) void {
    _ = dt_ms;
}

var rand = std.rand.DefaultPrng.init(0);

export fn draw(buf: [*]u32, width: usize, height: usize) void {
    const sl = buf[0 .. width * height];

    var y: usize = 0;
    while (y < height) : (y += 1) {
        var x: usize = 0;
        while (x < width) : (x += 1) {
            const rgba = [4]u8{
                @truncate(u8, x),
                0,
                @truncate(u8, y),
                0xFF
            };

            sl[(y * width) + x] = @bitCast(u32, rgba);
        }
    }
}

// export fn on_mouse_event(
//     ev: c.MouseEvent,
//     button: c_int,
//     x: usize,
//     y: usize,
// ) void {
//     const ev_name = switch (ev) {
//         c.MOUSE_DOWN => "mouse down",
//         c.MOUSE_UP => "mouse up",
//         else => unreachable,
//     };
//
//     debug("{s}: {} ({}, {})\n", .{ ev_name, button, x, y });
// }

export fn on_mouse_scroll_event(delta_y: f64) void {
    debug("scroll: {d}", .{delta_y});
}

// export fn on_key_event(
//     ev: c.KeyEvent,
//     keyname: [*]const u8,
//     keyname_len: usize,
// ) void {
//     const key = keyname[0..keyname_len];
//
//     const ev_name = switch (ev) {
//         c.KEY_DOWN => "key down",
//         c.KEY_UP => "key up",
//         else => unreachable,
//     };
//
//     debug("{s}: {s}\n", .{ ev_name, key });
// }
