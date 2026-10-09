from pathlib import Path

from reportlab.graphics import renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "distribution" / "pilot-invitation-example.html"
CODE = "TASSLA-TEST"
JOIN_URL = f"tassla://join?code={CODE}"


def make_qr_svg() -> str:
    qr = QrCodeWidget(JOIN_URL, barLevel="M", barBorder=4)
    drawing = Drawing(240, 240)
    drawing.add(qr)
    return renderSVG.drawToString(drawing)


def main() -> None:
    qr_svg = make_qr_svg()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        f"""<!doctype html>
<html lang="sv">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tassla – syntetiskt exempel på uppfödarkort</title>
<style>
  :root {{ color-scheme: light; font-family: Arial, sans-serif; color: #203b31; background: #f8f5ed; }}
  body {{ margin: 0; padding: 24px; }}
  main {{ box-sizing: border-box; width: min(100%, 560px); margin: 0 auto; padding: 32px; border: 1px solid #d8ded5; border-radius: 20px; background: #fff; text-align: center; }}
  .mark {{ display: inline-block; margin-bottom: 18px; padding: 8px 14px; border-radius: 999px; background: #e6eee5; font-weight: 700; letter-spacing: .04em; }}
  h1 {{ margin: 0 0 12px; font-size: 28px; }}
  p {{ margin: 0 auto 18px; max-width: 36ch; line-height: 1.5; }}
  .code {{ margin: 20px 0 8px; font-size: 32px; font-weight: 700; letter-spacing: .12em; }}
  .qr {{ width: 220px; height: 220px; margin: 12px auto; }}
  .notice {{ margin-top: 20px; padding: 12px; border-radius: 12px; background: #f5eee3; font-size: 14px; }}
  @media print {{ body {{ padding: 0; }} main {{ width: 100%; border: 0; }} }}
</style>
<main>
  <div class="mark">TASSLA · EXEMPEL</div>
  <h1>Följ valpens första tid</h1>
  <p>Skanna koden med mobilkameran. Om Tassla redan finns på mobilen öppnas appen. Annars installerar du via din inbjudan och skriver koden nedan i appen.</p>
  <div class="qr" aria-label="QR-kod för syntetisk testkod">{qr_svg}</div>
  <div class="code">{CODE}</div>
  <p>QR-länken visar hur uppfödarkortet kan fungera. Koden är syntetisk och inte aktiverad i någon databas.</p>
  <div class="notice"><strong>Endast syntetiskt exempel.</strong> Länkmottagning finns i appen, men den här koden är inte aktiv. Tryck eller dela inte exemplet med köpare.</div>
</main>
</html>
""",
        encoding="utf-8",
    )
    print(OUTPUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
