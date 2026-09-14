# Calculator TP & SL

Aplicație web în limba română pentru calcul asistat al nivelurilor Stop Loss, Take Profit, Fibonacci, raport risc–recompensă net și dimensionarea poziției.

## Utilizare rapidă

1. Deschide `index.html` într-un browser modern.
2. Încarcă o captură de grafic.
3. Introdu două prețuri vizibile pe axă și marchează punctele A și B.
4. Marchează Swing High, Swing Low și intrarea.
5. Confirmă ATR-ul, spreadul, slippage-ul, contract size, cursul valutar, lotul minim și pasul.
6. Apasă **Calculează și validează**.
7. Completează checklistul înainte de a considera scenariul eligibil.

Imaginea este procesată local în browser și nu este încărcată pe un server.

## Metodologie

- SL LONG: sub Swing Low cu un tampon egal cu maximul dintre tamponul manual și ATR × multiplicator.
- SL SHORT: peste Swing High cu același principiu.
- TP minim include spreadul, slippage-ul și comisionul astfel încât raportul R:R net să atingă pragul ales.
- Dimensionarea se face prin împărțirea bugetului de risc la riscul net estimat pe lot, apoi rotunjire în jos la pasul permis.
- Fibonacci este calculat între Swing Low și Swing High pentru nivelurile 0–200%.

## Limitări

Aplicația nu oferă recomandări de investiții și nu poate valida automat știrile, lichiditatea, programul de tranzacționare, rollover-ul sau specificațiile brokerului. Datele extrase prin marcarea imaginii trebuie confirmate manual. Stop Loss-ul poate fi executat mai nefavorabil în caz de gap sau slippage.
