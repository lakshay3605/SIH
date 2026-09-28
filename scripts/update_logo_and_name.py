import os
from PIL import Image, ImageDraw

def generate_icons():
    src_path = r"C:\Users\laksh\.gemini\antigravity-ide\brain\44173ce2-2792-4a39-a30d-a5d730dee72d\.user_uploaded\media_1790612656465.png"
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source logo not found at {src_path}")
    
    orig = Image.open(src_path).convert("RGBA")
    bbox = orig.getbbox()
    logo = orig.crop(bbox)
    print(f"Original cropped logo: {logo.size}")

    # 1. Save high-res logo in Frontend public assets
    frontend_asset_path = os.path.abspath(r"Frontend\public\assets\samvaad_logo.png")
    os.makedirs(os.path.dirname(frontend_asset_path), exist_ok=True)
    logo.save(frontend_asset_path, format="PNG")
    print(f"Saved frontend asset: {frontend_asset_path}")

    # Density specifications: (icon_size, adaptive_foreground_size)
    densities = {
        "mdpi": (48, 108),
        "hdpi": (72, 162),
        "xhdpi": (96, 216),
        "xxhdpi": (144, 324),
        "xxxhdpi": (192, 432)
    }

    res_dirs = [
        os.path.abspath(r"HindiSantaliApp\app\src\main\res"),
        os.path.abspath(r"reference_code\Android_src\main\res")
    ]

    for res_dir in res_dirs:
        if not os.path.exists(res_dir):
            continue

        for density, (icon_sz, fg_sz) in densities.items():
            mipmap_dir = os.path.join(res_dir, f"mipmap-{density}")
            os.makedirs(mipmap_dir, exist_ok=True)

            # --- A. ic_launcher.png (Clean white square with comfortable padding) ---
            sq = Image.new("RGBA", (icon_sz, icon_sz), (255, 255, 255, 255))
            tw = int(icon_sz * 0.82)
            th = int(logo.height * tw / logo.width)
            if th > int(icon_sz * 0.82):
                th = int(icon_sz * 0.82)
                tw = int(logo.width * th / logo.height)
            r_logo = logo.resize((tw, th), Image.Resampling.LANCZOS)
            sq.paste(r_logo, ((icon_sz - tw) // 2, (icon_sz - th) // 2), r_logo)
            sq_path = os.path.join(mipmap_dir, "ic_launcher.png")
            sq.save(sq_path, format="PNG")

            # --- B. ic_launcher_round.png (Circular white badge with safe margins) ---
            rd = Image.new("RGBA", (icon_sz, icon_sz), (0, 0, 0, 0))
            mask = Image.new("L", (icon_sz, icon_sz), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, icon_sz, icon_sz), fill=255)
            white_bg = Image.new("RGBA", (icon_sz, icon_sz), (255, 255, 255, 255))
            rd.paste(white_bg, (0, 0), mask)
            
            tw_rd = int(icon_sz * 0.70)
            th_rd = int(logo.height * tw_rd / logo.width)
            if th_rd > int(icon_sz * 0.70):
                th_rd = int(icon_sz * 0.70)
                tw_rd = int(logo.width * th_rd / logo.height)
            r_logo_rd = logo.resize((tw_rd, th_rd), Image.Resampling.LANCZOS)
            rd.paste(r_logo_rd, ((icon_sz - tw_rd) // 2, (icon_sz - th_rd) // 2), r_logo_rd)
            rd_path = os.path.join(mipmap_dir, "ic_launcher_round.png")
            rd.save(rd_path, format="PNG")

            # --- C. ic_launcher_foreground.png (Adaptive icon safe zone) ---
            fg = Image.new("RGBA", (fg_sz, fg_sz), (0, 0, 0, 0))
            # Safe zone in adaptive icon is 72dp out of 108dp (66.6%)
            tw_fg = int(fg_sz * 0.48)
            th_fg = int(logo.height * tw_fg / logo.width)
            if th_fg > int(fg_sz * 0.48):
                th_fg = int(fg_sz * 0.48)
                tw_fg = int(logo.width * th_fg / logo.height)
            r_logo_fg = logo.resize((tw_fg, th_fg), Image.Resampling.LANCZOS)
            fg.paste(r_logo_fg, ((fg_sz - tw_fg) // 2, (fg_sz - th_fg) // 2), r_logo_fg)
            fg_path = os.path.join(mipmap_dir, "ic_launcher_foreground.png")
            fg.save(fg_path, format="PNG")

        # --- D. mipmap-anydpi-v26 XMLs ---
        anydpi_dir = os.path.join(res_dir, "mipmap-anydpi-v26")
        os.makedirs(anydpi_dir, exist_ok=True)
        adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'''
        with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w", encoding="utf-8") as f:
            f.write(adaptive_xml)
        with open(os.path.join(anydpi_dir, "ic_launcher_round.xml"), "w", encoding="utf-8") as f:
            f.write(adaptive_xml)

        # --- E. drawable/ic_launcher_background.xml ---
        drawable_dir = os.path.join(res_dir, "drawable")
        os.makedirs(drawable_dir, exist_ok=True)
        bg_xml = '''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M0,0h108v108h-108z" />
</vector>
'''
        with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
            f.write(bg_xml)

        # Clean foreground vector if present to avoid conflicts
        fg_xml_path = os.path.join(drawable_dir, "ic_launcher_foreground.xml")
        if os.path.exists(fg_xml_path):
            os.remove(fg_xml_path)

        print(f"Generated icons and XMLs for {res_dir}")

if __name__ == "__main__":
    generate_icons()
