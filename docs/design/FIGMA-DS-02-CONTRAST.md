# FIGMA-DS-02 – kontrastunderlag

Datum: 2026-10-08. Källa: INVENTORY.md §4.1–4.2 och den låsta variabelarkitekturen i FIGMA-DS-01 plan v3. **Beräknat från dokumenterade tokens, inte avläst eller verifierat i Figma.** Inga tokens har ändrats. Tabellen ska publiceras visuellt i Foundations när Figma-MCP är tillgängligt.

WCAG-metod: omvandla varje sRGB-kanal c till 0–1, använd c/12,92 för c ≤ 0,04045, annars ((c+0,055)/1,055)^2,4. Relativ luminans L = 0,2126R + 0,7152G + 0,0722B. Kontrast = (Lljus + 0,05)/(Lmörk + 0,05). Beräkningen utfördes lokalt med Python; gränserna bedömdes före avrundning till två decimaler.

| Färgpar | Förgrund | Bakgrund | Kontrast | Text ≥4,5 | Ikon/kontroll ≥3 |
|---|---|---|---|---|---|
| textPrimary / background | #1C3027 | #F7F1E7 | 12.45:1 | Ja | Ja |
| textSecondary / background | #536257 | #F7F1E7 | 5.75:1 | Ja | Ja |
| onPrimary / primary | #FFFFFF | #186A4D | 6.55:1 | Ja | Ja |
| danger / dangerSurface | #A32929 | #F7EAE7 | 6.15:1 | Ja | Ja |
| success / successSurface | #186A4D | #EAF3EC | 5.78:1 | Ja | Ja |
| category/pee/fg / bg | #246A98 | #E4EEF4 | 4.97:1 | Ja | Ja |
| category/poop/fg / bg | #885839 | #F5E9DF | 5.03:1 | Ja | Ja |
| category/food/fg / bg | #186A4D | #E5EFE8 | 5.56:1 | Ja | Ja |
| category/sleep/fg / bg | #72558E | #F0E9F5 | 5.19:1 | Ja | Ja |
| category/awake/fg / bg | #72558E | #F0E9F5 | 5.19:1 | Ja | Ja |
| category/walk/fg / bg | #785716 | #F5E7BF | 5.38:1 | Ja | Ja |
| category/training/fg / bg | #186A4D | #E5EFE8 | 5.56:1 | Ja | Ja |
| category/vaccination/fg / bg | #A32929 | #F7EAE7 | 6.15:1 | Ja | Ja |
| category/deworming/fg / bg | #72558E | #F0E9F5 | 5.19:1 | Ja | Ja |
| category/veterinary/fg / bg | #246A98 | #E4EEF4 | 4.97:1 | Ja | Ja |

Alla 15 beställda dokumenterade färgpar uppfyller båda trösklarna. Primärfärgen kan behållas. Kategorierna ligger mellan 4,97 och 6,15:1.

## Reproducera lokalt

Kör från repositoryroten. Kommandot läser tabellens dokumenterade hexvärden, räknar opak kontrast och skriver resultatet; det hämtar inga Figma-värden.

```bash
python - <<'PY'
from pathlib import Path
import re
def luminance(color):
    c = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in c]
    return sum(v * w for v, w in zip(c, (.2126, .7152, .0722)))
source = Path('docs/design/FIGMA-DS-02-CONTRAST.md').read_text()
pairs = re.findall(r'^\| ([^|]+) \| (#[0-9A-F]{6}) \| (#[0-9A-F]{6}) \|', source, re.M)
pairs += [('border/surface', '#D9DFD7', '#FFFFFF'), ('border/background', '#D9DFD7', '#F7F1E7'), ('dangerBorder/dangerSurface', '#D5A5A0', '#F7EAE7')]
for name, fg, bg in pairs:
    lo, hi = sorted((luminance(fg), luminance(bg)))
    print(f'{name}: {(hi + .05) / (lo + .05):.2f}:1')
PY
```

## Kontroller och gradient – återstår

`border #D9DFD7` ger bara 1,36:1 på surface och 1,21:1 på background; `dangerBorder #D5A5A0` ger 1,84:1 på dangerSurface. Dekorativa kortramar behöver inte fungera som enda kontrollsignal. Om dessa färger identifierar ett fält/checkbox ska en betydelsebärande token rättas: föreslaget `Color/controlBorder` aliasar befintlig `Primitives/muted #536257`, och felkontrollens kant använder `Color/danger`. Detta är en planerad Figma-åtgärd, inte implementerad eller godkänd appändring.

Hero-text över gradient, disabled-opacitet, fokusindikatorer och verkliga kontrollkanter är **NOT TESTABLE** utan Figma-rendering. Blanda inte transparenta färger med opaka kontrasttal. Bottenscrim ska få egna tokens och vara tillräckligt mörk över hela textområdet, även med ljusast möjliga platshållare. Verifiera sammansatta färger i slutlig audit och korrigera tokens om 4,5:1 inte nås.
