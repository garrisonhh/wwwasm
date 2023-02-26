#ifndef WWWASM_SPEC_H
#define WWWASM_SPEC_H

/*
 * wwwasm requires that you implement these:
 *
 * `void *alloc(size_t nbytes)`
 * `void free(void *ptr, size_t nbytes)`
 *
 * `void draw(uint32_t *draw_buffer, size_t width, size_t height)`
 * draw_buffer is an array of width x height RGBA values.
 *
 * wwwasm expects you to implement some or all of these functions:
 *
 * --- program lifetime ---
 *
 * `void init(void)`
 * called at the beginning of the program.
 *
 * `void deinit(void)`
 * called at the end of the program.
 *
 * `void update(void)`
 * called on each tick.
 *
 * --- events ---
 *
 * `void on_mouse_event(MouseEvent, int button, size_t x, size_t y)`
 * `void on_key_event(KeyEvent, const char *keyname, size_t keyname_len)`
 */

typedef long long unsigned int size_t;

// debug logging function
void debug(const char *msg, size_t len);

void get_window_size(size_t *width, size_t *height);
void get_mouse_pos(size_t *x, size_t *y);

typedef enum MouseEvent {
    MOUSE_DOWN,
    MOUSE_UP,
} MouseEvent;

typedef enum KeyEvent {
    KEY_DOWN,
    KEY_UP,
} KeyEvent;

#endif /* WASM_SPEC_H */