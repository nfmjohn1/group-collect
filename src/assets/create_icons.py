import base64

# 16x16 green square PNG (minimal)
icon16_base64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJElEQVR42mP8z8DwHwMDAwgzDAqD4a/RAAD//wMAAwCDoYEBAAD//w=="

# Decode and write
with open('icon16.png', 'wb') as f:
    # Create a simple green square
    header = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x10\x00\x00\x00\x10\x08\x02\x00\x00\x00\x90\x91h6'
    f.write(header)

print("Icons placeholder created")
