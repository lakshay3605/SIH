from PIL import Image
import os

source_image = r"C:\Users\sharj\.gemini\antigravity-ide\brain\7b7a9cb1-a68f-4926-a09c-b7e5082389df\samvaad_app_icon_1790483929284.jpg"
res_dir = r"d:\sih_nomination_filling\Samvaad_app\HindiSantaliApp\app\src\main\res"

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

img = Image.open(source_image).convert("RGBA")
# For a launcher icon, standard size is enough
for density, size in sizes.items():
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    dir_path = os.path.join(res_dir, f"mipmap-{density}")
    os.makedirs(dir_path, exist_ok=True)
    # Save as ic_launcher.png
    resized.save(os.path.join(dir_path, "ic_launcher.png"), "PNG")
    resized.save(os.path.join(dir_path, "ic_launcher_round.png"), "PNG")

print("Icons generated successfully!")
