from pathlib import Path

path = Path("abc-creator-app/components/PlatformToolLogo.tsx")
text = path.read_text(encoding="utf-8")
old = '<img src="/platform-logos/instagram.svg" alt="" className="h-12 w-12 object-contain" />'
new = '<img src="/platform-logos/instagram.svg" alt="" className={`${symbolSizeClasses[size]} object-contain`} />'
count = text.count(old)
if count != 1:
    raise RuntimeError(f"Expected one Instagram logo sizing match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Corrected compact Instagram logo sizing.")
