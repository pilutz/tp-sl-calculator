# TP/SL Studio v2
Aplicație statică: https://pilutz.github.io/tp-sl-calculator/

## Utilizare
1. Încarcă o captură PNG/JPG/WebP cu minimum 61 de lumânări roșii/verzi standard. Selectează doar panoul cu preț; axa numerică rămâne în dreapta selecției.
2. Citește axa automat prin OCR sau indică A/B la două prețuri vizibile. A/B calibrează imaginea, nu sunt swing-uri. Alege axă liniară/logaritmică conform sursei.
3. Detectează lumânările, verifică toate corpurile/umbrele și scara, completează instrument, interval, tick. Confirmă sursa; ultima lumânare este exclusă implicit.
4. Generează automat BUY LONG, SELL SHORT sau FĂRĂ SETUP. Nu există selector manual al direcției.
5. Completează costuri și specificații verificate pentru simularea lotajelor 2% / 20%.

CSV alternativ: coloane time (opțional), open, high, low, close. Ordine strict vechi → nou. Separator virgulă sau punct și virgulă; pentru zecimală cu virgulă folosește punct și virgulă. Golurile de sesiune/proveniența și tipul lumânărilor se confirmă în sursă.

## Metodă
- Pivot strict mai înalt/mai jos decât câte 2 vecini pe fiecare parte, fără anticipare.
- LONG: ultimele 2 maxime și minime cresc, EMA20 > EMA50, pantă EMA20 pe 5 lumânări pozitivă, close > EMA20; SHORT invers. Diferența swing-urilor depășește 0,06 ATR.
- EMA inițializată cu SMA. ATR14 / RSI14 Wilder; MACD 12,26,9. Minimum 60 de bare închise; valorile pot diferi de platformă din cauza istoricului de inițializare și, la foto, a cuantizării pixelilor.
- Intrare condiționată: depășirea pivotului / extremelor ultimelor 3 lumânări, închidere și retest; nivel de referință cu 1 tick tampon. Execuția la alt preț necesită recalculare.
- SL la ultimul swing de invalidare ± max(2 ticks, 0,25 ATR). TP primul pivot istoric dincolo de intrare, cu 1 tick înainte. Fără pivot: proiecție 161,8% marcată neconfirmată. Nu ajustează țintele pentru a forța 2:1.
- Model de cost pe preț de referință: risc = distanță SL + spread + slippage tur-retur + comisioane/valoare-punct. Spread numărat o singură dată. Conversia RON presupune curs constant; costurile per lot trebuie să includă costurile relevante orizontului.
- Lotaj limitat de bugetul zilnic rămas și marja disponibilă, rotunjit în jos. Grila pornește de la volumul minim; verifică grila brokerului.
- Nu calculează probabilități, volum/VWAP, știri și nu trimite ordine. Nu demonstrează pragul de 65%; 20% este doar simulare. Volum de execuție zero.

## Fotografii și confidențialitate
Detector local pentru corpuri pline roșii/verzi și umbre cu contrast. Alte culori, lumânări goale, indicatori suprapuși, panouri multiple, Heikin-Ashi/Renko, rezoluție mică sau axe decupate nu sunt suportate fiabil. Confirmarea tuturor umbrelor și lumânărilor rămâne obligatorie. Folosește CSV dacă citirea nu este fidelă.
Tesseract.js 6.0.1 se descarcă din CDN numai la cererea de citire a axei. Rulează în browser; poza nu este trimisă pe server. Sunt necesare 3 etichete coerente. Separatoarele zecimale/mii și cifrele OCR trebuie confirmate.
Nicio cheie API, feed live, acces la cont sau persistență server. Demo nu conține cotații sau date financiare personale.

## Testare și publicare
Node 20+, npm install, npx playwright install chromium, npm test.
GitHub Actions testează calculele și browserul înainte de publicarea celor 5 fișiere statice. Acoperă trend/range, indicatori, TP/SL, costuri, marjă, rotunjire, invalidări, CSV, imagini sintetice cu OHLC cunoscut, integrare OCR simulată, export și mobil.
Acuratețea OCR pe fotografii reale nu este certificată prin testul simulat. Nu există backtest statistic al strategiei.
Coeficienții swing/ATR sunt reguli ale aplicației, nu reguli ale brokerului.
