# TP/SL Studio v3.4

Aplicație statică: https://pilutz.github.io/tp-sl-calculator/

Versiunea 3.4 calculează separat scenariile LONG și SHORT, compară intrarea, invalidarea, ținta, riscul, potențialul și R:R brut/net, apoi selectează numai sensul confirmat de structură. Elimină automat orice țintă aflată pe partea greșită a intrării. Dacă fotografia nu conține un pivot tehnic dincolo de intrare, afișează și pragul matematic pentru 2R, dar îl marchează clar drept neconfirmat și păstrează verdictul „FĂRĂ SETUP COMPLET”. De asemenea, citește prețul principal din geometria antetului și preferă timestampul explicit al graficului, pentru a nu confunda o etichetă a axei sau ora `09:00` cu ultima cotație.

## Utilizare rapidă

1. Selectează simultan una până la trei capturi din aceeași situație: ideal graficul mărit, formularul ordinului și detaliile contractului.
2. Apasă **Preia automat datele din toate fotografiile**. Citirea OCR și detectorul lumânărilor rulează local în browser.
3. Verifică tabelul de reconciliere. Aplicația compară valorile repetate, arată intervalele observate și marchează contradicțiile; nu aprobă automat datele.
4. Controlează marcajele lumânărilor și reperele A/B. A/B sunt două prețuri de pe axă, nu swing high/low. Dacă citirea automată eșuează, selectează manual panoul și axa.
5. Confirmă instrumentul, intervalul, tick-ul, data/fusul și faptul că toate lumânările/umbrele sunt corecte. Ultima lumânare este exclusă implicit dacă nu este închisă.
6. Aplicația generează ambele variante, le afișează într-un tabel comparativ și alege automat una dintre: **BUY LONG condiționat**, **SELL SHORT condiționat** sau **FĂRĂ SETUP**. Nu există selector manual pentru direcție.
7. Pentru simularea lotajului completează și confirmă datele lipsă: equity, volum minim/pas, slippage, calendarul evenimentelor și statutul tuturor pozițiilor.

Fotografiile pot furniza automat, când sunt lizibile: instrument, interval, preț curent, bid/ask, volum, marjă, fonduri libere, spread, comision, valoarea contractului, swap, valoarea pipului, starea pieței și indicii unei poziții existente. Equity dedus ca „fonduri libere + marjă” este doar informativ și nu este introdus automat.

## Regula tehnică

- Sunt necesare minimum 35 de lumânări închise; de la 50 în sus se folosește și alinierea EMA20/EMA50.
- Pivotul este strict mai înalt sau mai jos decât câte două lumânări vecine de fiecare parte, fără folosirea datelor viitoare.
- Pentru ambele sensuri se calculează un plan ipotetic. LONG: ultimele două maxime și minime cresc, EMA20 urcă, prețul este peste EMA20 și, când există suficient istoric, EMA20 este peste EMA50. SHORT este invers. Diferența structurii trebuie să depășească 0,06 ATR.
- Indicatorii sunt calculați reproductibil: EMA inițializată cu SMA, ATR14 și RSI14 Wilder, MACD 12/26/9.
- Intrarea este condiționată de depășirea nivelului tehnic cu un tick, o lumânare închisă și un retest menținut.
- SL este dincolo de ultimul swing care invalidează structura, cu tampon `max(2 ticks, 0,25 × ATR)`.
- TP este primul pivot istoric relevant, cu un tick înainte. Dacă nu există pivot, se poate arăta o proiecție Fibonacci 161,8% drept țintă neconfirmată, dar numai dacă se află dincolo de intrare în direcția tranzacției. Aplicația nu mută artificial SL sau TP ca să forțeze 2:1.
- R:R mai mare nu este suficient: sensul trebuie să treacă filtrul de trend. Distanța mai mică până la SL nu înseamnă automat risc monetar mai mic; acesta depinde de lotaj și costuri.

## Reconcilierea celor trei capturi

Valorile apropiate sunt agregate în limite explicite; discrepanțele materiale rămân vizibile. Se calculează doar relații verificabile:

- valoare per lot = valoarea pipului afișată ÷ volumul selectat;
- marjă per lot = marja afișată ÷ volumul selectat;
- curs RON/USD implicit = valoarea contractului în RON ÷ valoarea în USD;
- spread din cotații = BUY − SELL.

Un nivel detectat lângă o poziție existentă poate fi intrare, SL, ordin sau etichetă grafică. Dacă geometria este incompatibilă cu direcția (de exemplu un presupus SL sub piață pentru un SHORT), aplicația îl marchează ca ambiguu și blochează concluzia, în loc să ghicească.

## Statistică istorică

O fotografie nu poate furniza o probabilitate de profit validă. Pentru estimare, importă un CSV cu minimum 1.200 de bare OHLC, în ordine vechi → nou, pentru exact același instrument, interval și tip de contract.

Aplicația:

- păstrează prima jumătate ca istoric anterior și evaluează numai jumătatea cronologică finală;
- la fiecare moment folosește doar barele disponibile atunci;
- cere activarea intrării în următoarele trei bare și urmărește maximum 12 bare;
- testează o țintă standard de 2R, SL de −1R și înregistrează expirarea la rezultatul real în R, nu ca 0R;
- evită suprapunerea tranzacțiilor;
- afișează rata TP-înainte-de-SL, rata SL, expirările, rata activării, media în R, profit factor, drawdown maxim în R și variația pe patru segmente cronologice;
- afișează un interval Wilson 95% pentru rata TP și cere cel puțin 30 de cazuri activate.

Intervalul Wilson urmează metoda descrisă de [NIST](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm). Separarea cronologică urmează principiul testării seriilor temporale fără antrenare pe viitor, documentat și de [scikit-learn TimeSeriesSplit](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html). Rezultatele rămân descriptive; selecția repetată a regulilor pe același istoric poate produce supra-optimizare, problema discutată de [Bailey et al.](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253).

Scorul de calitate 0–100 al unei fotografii este un diagnostic al datelor, structurii și țintei. Nu este probabilitate de profit. Nici rata istorică nu este automat probabilitatea tranzacției următoare și nu demonstrează pragul de 65%.

## Costuri și risc

Modelul de preț include o singură dată spreadul, slippage tur-retur și comisioanele convertite prin valoarea unei mișcări de preț. Lotajul este limitat de riscul zilnic rămas și marja disponibilă, apoi rotunjit în jos la pasul permis. Grila începe la volumul minim.

Simulările de 2% și 20% sunt alternative, nu bugete cumulative. O poziție existentă/necunoscută, piața închisă, un eveniment major neverificat, datele neconfirmate, o țintă neconfirmată, R:R net sub 2 sau o estimare insuficientă blochează eligibilitatea. Volumul de execuție rămâne întotdeauna zero.

Aplicația nu are feed live, nu accesează contul XTB și nu trimite ordine. Prețul CFD poate diferi de grafic prin spread, contract, rollover și ajustări. Un SL nu garantează pierderea maximă în caz de gap sau slippage.

## Fotografii și confidențialitate

Sunt acceptate PNG/JPG/WebP, maximum 15 MB fiecare. Detectorul urmărește lumânări standard cu corpuri pline roșii/verzi și umbre contrastante. Lumânări goale, Heikin-Ashi/Renko, indicatori suprapuși, rezoluția slabă sau axele decupate pot necesita corecție manuală ori CSV.

Tesseract.js 6.0.1 este descărcat din CDN numai când pornești citirea. Procesarea se face în browser; aplicația nu are server de upload. Exportul JSON exclude imaginile și textul OCR brut, păstrând doar câmpurile structurate și proveniența.

## Testare și publicare

```bash
npm install
npx playwright install chromium
npm test
```

GitHub Actions rulează testele de calcul și scenariile complete de browser înainte de publicare. Sunt testate trend/range, indicatori, TP/SL, costuri, marjă, rotunjire, invalidări, CSV, backtest cronologic, interval Wilson, imagini sintetice cu OHLC cunoscut, trei capturi OCR simulate, reconciliere, poziție existentă, export și layout mobil.

Acuratețea OCR pe orice fotografie reală nu este garantată; confirmarea vizuală rămâne obligatorie. Coeficienții swing/ATR și regulile statistice sunt reguli ale aplicației, nu reguli XTB.
