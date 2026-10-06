// Country names for forms, built from ISO 3166-1 codes with the browser's own
// translations (Intl.DisplayNames), so there is no long list of names to
// maintain. Sorted A–Z, with the countries most XK visitors come from first.

const CODES = (
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM " +
  "CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU " +
  "IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD " +
  "MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM " +
  "ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US " +
  "UY UZ VU VA VE VN YE ZM ZW"
).split(" ");

const FIRST = ["IN", "AE", "GB", "US", "SG", "PK", "NG", "ZA", "MY", "AU"];

function build() {
  let names;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  const name = (code) => (names ? names.of(code) : code) || code;
  const rest = CODES.filter((c) => !FIRST.includes(c))
    .map((code) => ({ code, name: name(code) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...FIRST.map((code) => ({ code, name: name(code) })), ...rest];
}

let cache;
export function countryOptions() {
  if (!cache) cache = build();
  return cache;
}

// "IN" → 🇮🇳 (regional indicator symbols).
export function flagEmoji(code) {
  return String(code || '').toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Flag emoji only where the system font draws them: Windows has no flag glyphs
// and shows the two letters instead, so callers skip the flag there.
let flagSupport;
export function supportsFlags() {
  if (flagSupport !== undefined) return flagSupport;
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = ctx.canvas.height = 16;
    ctx.font = '14px sans-serif';
    ctx.fillText(flagEmoji('IN'), 0, 14);
    const px = ctx.getImageData(0, 0, 16, 16).data;
    let colour = false;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] && (Math.abs(px[i] - px[i + 1]) > 30 || Math.abs(px[i + 1] - px[i + 2]) > 30)) colour = true;
    }
    flagSupport = colour;
  } catch {
    flagSupport = false;
  }
  return flagSupport;
}
