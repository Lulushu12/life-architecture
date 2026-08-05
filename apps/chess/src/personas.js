// Bot persona cast for the chess app chat/banter system.
// Eight original characters, weakest to strongest, each with a distinct
// voice. Mostly English with natural Romanian sprinkles, since the app's
// owner and friends are Romanian.

export const PERSONAS = [
  {
    id: "picu",
    name: "Picu",
    tagline: "8 years old, castles too early, giggles a lot.",
    avatar: "🐣",
    elo: 850,
    style: { aggression: 0.6, chattiness: 0.95 },
    lines: {
      greeting: [
        "Hai să jucăm! Eu încep tare, promit!",
        "Bună! Sper să nu plâng dacă pierd... iar.",
        "Gata, gata, mut și eu ceva!",
        "Hopa, ce piese multe ai! Le vreau pe toate.",
      ],
      i_capture: [
        "Am luat-o! Am luat-o! Ai văzut?",
        "Nyam! O piesă mai puțin la tine.",
        "Asta a fost ușor, hihi.",
        "Pac! Îmi place jocul ăsta.",
      ],
      you_capture: [
        "Aoleu, mi-ai luat calul. Nu e frumos.",
        "Ok, ok, a fost o greșeală de-a mea.",
        "Bine, bine, o iei pe asta, dar tot câștig eu.",
        "Aoleu, iar am uitat piesa acolo.",
      ],
      i_blunder: [
        "Vai, ce am făcut?! Nu, nu, nu!",
        "Oops. Am mutat prea repede iar.",
        "Frate, mă doare capul, am greșit rău.",
        "Hai, prefacem că nu s-a întâmplat asta?",
      ],
      you_blunder: [
        "Hehe, cred că ai greșit! Iau piesa!",
        "Aha! Prindeai musca, nu piesa mea!",
        "Nu, nu, chiar poți să retragi? Glumesc, iau!",
        "Frate, asta a fost cadou, mulțumesc!",
      ],
      i_check: [
        "Șah! Șah! Fugi, fugi!",
        "Ha, regele tău e speriat acum!",
        "Șah, frate! Ce faci acum?",
      ],
      you_check: [
        "Aoleu, șah! Stai să mă gândesc...",
        "Ok, ok, nu intra în panică, Picu.",
        "Iar șah? Îmi place jocul tău.",
      ],
      castle: [
        "Am pus regele la adăpost, ca-n bunker!",
        "Turnul și regele fac schimb, tataie!",
        "Gata, sunt sigur acum. Cred.",
      ],
      promote: [
        "Damă nouă! Am făcut-o, am făcut-o!",
        "Pion mic a crescut mare, uau!",
        "Acum am două dame, tremură!",
      ],
      winning: [
        "Cred că... câștig? Nu-mi vine să cred!",
        "Hai să văd dacă țin poziția asta, hihi.",
        "Sunt bine acum, foarte bine!",
      ],
      losing: [
        "Nu e bine deloc, nu e bine deloc.",
        "Ok, panichez puțin acum, frate.",
        "Mai am o șansă, nu? Nu?",
      ],
      equal: [
        "Ne luptăm din greu, egal la egal!",
        "Nimeni nu cedează, îmi place!",
        "Tot împingem, tot împingem, hai!",
      ],
      slow_move: [
        "Frate, te-ai dus după apă sau ce?",
        "Aștept, aștept... mă plictisesc puțin.",
        "Hai, hai, mută, mi-e somn!",
      ],
      endgame: [
        "Uau, au mai rămas puține piese!",
        "Final de joc, aici mă descurc, zic eu.",
        "Puține piese, mult mister!",
      ],
      i_win: [
        "Am câștigat! Am câștigat! Cine credea?!",
        "Mat! Sunt cel mai tare azi!",
        "Da, da, da! Îi spun și mamei!",
      ],
      i_lose: [
        "Ok, ai câștigat. Revanșă, te rog!",
        "Bine jucat... dar data viitoare te bat!",
        "Aoleu, am pierdut. Hai încă o dată!",
      ],
      draw: [
        "Egalitate? Ok, măcar n-am pierdut!",
        "Remiză, remiză, nimeni nu plânge.",
        "Am ținut-o egal, nu-i rău deloc!",
      ],
      you_brilliant: [
        "Aoleu, aia a fost genial! Cum ai văzut-o?",
        "Uau, mutarea aia m-a rupt complet!",
        "Ok, ești bun bun, recunosc!",
      ],
    },
  },
  {
    id: "mirela",
    name: "Mirela",
    tagline: "Started playing last year at the office club, still counting squares.",
    avatar: "😊",
    elo: 1100,
    style: { aggression: 0.25, chattiness: 0.75 },
    lines: {
      greeting: [
        "Bună! Sunt Mirela, joc de un an, fii blând cu mine.",
        "Hai să vedem ce pot face azi, bine?",
        "Salut! Promit să mă gândesc bine la mutări.",
        "Bine ai venit! Sper la un joc frumos.",
      ],
      i_capture: [
        "Oh, am luat piesa! Nu credeam că merge.",
        "Bine, am reușit schimbul ăsta, cred.",
        "Am prins-o! Mic pas înainte pentru mine.",
      ],
      you_capture: [
        "Ah, ai fost mai rapid decât mine, bravo.",
        "Bine, îmi pierd piesa, învăț din asta.",
        "Ai văzut ceva ce eu n-am văzut, felicitări.",
      ],
      i_blunder: [
        "Vai, cred că am greșit rău de tot.",
        "Hmm, asta nu a fost mutarea bună, sincer.",
        "Îmi pare rău pentru mine, am scăpat ceva.",
      ],
      you_blunder: [
        "Stai, chiar ai lăsat asta liberă? Bine, o iau.",
        "Se întâmplă și celor buni, o iau cu grijă.",
        "Nu vreau să profit prea tare, dar... o iau.",
      ],
      i_check: [
        "Șah, cred, dacă am calculat bine.",
        "Am dat șah! Sper să fie folositor.",
        "Șah! Măcar atât am reușit.",
      ],
      you_check: [
        "Șah mie, ok, mă gândesc puțin.",
        "Bine, regele meu e în pericol, un moment.",
        "Șah, trebuie să fiu atentă acum.",
      ],
      castle: [
        "Am rocat, în sfârșit regele e mai sigur.",
        "Bine, cred că asta era mutarea înțeleaptă.",
        "Rocada făcută, respir mai ușor acum.",
      ],
      promote: [
        "Am promovat un pion! Nu-mi vine să cred.",
        "Damă nouă, bine, asta ajută mult.",
        "Pionul a ajuns până la capăt, ce bucurie.",
      ],
      winning: [
        "Cred că stau bine acum, sper să nu stric.",
        "Bine, poziția pare în favoarea mea, atenție.",
        "Merge bine, hai să nu mă grăbesc.",
      ],
      losing: [
        "Nu arată prea bine pentru mine, sincer.",
        "Bine, sunt în dificultate, dar încerc.",
        "Cred că am nevoie de un miracol acum.",
      ],
      equal: [
        "Suntem la egalitate, joc frumos și strâns.",
        "Bine, niciunul nu cedează, îmi place lupta.",
        "Poziție echilibrată, trebuie să fiu atentă.",
      ],
      slow_move: [
        "Ia-ți timpul, nu e nicio grabă, bine?",
        "Mă gândesc și eu la ce urmează, calm.",
        "Bine, aștept liniștită mutarea ta.",
      ],
      endgame: [
        "Am ajuns la final, puține piese rămase.",
        "Bine, aici trebuie să calculez cu grijă.",
        "Finalul ăsta mă face puțin emoționată.",
      ],
      i_win: [
        "Am câștigat? Vai, ce surpriză frumoasă!",
        "Mulțumesc pentru joc, a fost o victorie dulce.",
        "Bine, azi a fost ziua mea norocoasă!",
      ],
      i_lose: [
        "Bine jucat, am învățat multe azi.",
        "Felicitări, meritai victoria asta.",
        "Am pierdut, dar mi-a plăcut mult jocul.",
      ],
      draw: [
        "O remiză frumoasă, nimeni nu pleacă supărat.",
        "Bine, egalitate dreaptă după o luptă bună.",
        "Îmi place cum s-a terminat, corect pentru amândoi.",
      ],
      you_brilliant: [
        "Vai, ce mutare frumoasă, felicitări sincere!",
        "Nu m-am gândit deloc la asta, bravo ție!",
        "Asta a fost genial, chiar m-ai impresionat.",
      ],
    },
  },
  {
    id: "nea-fanica",
    name: "Nea Fănică",
    tagline: "Plays for sunflower seeds in the park, never loses his hat.",
    avatar: "🎩",
    elo: 1350,
    style: { aggression: 0.5, chattiness: 0.85 },
    lines: {
      greeting: [
        "Hai, așază-te, frate, să-ți arăt eu șah de parc.",
        "Graba strică treaba — hurry ruins the work. Stai calm.",
        "Cine se scoală de dimineață departe ajunge, hai să vedem cine mută bine azi.",
        "Bine ai venit la masa mea, aici se joacă serios, cu semințe.",
      ],
      i_capture: [
        "Cine sapă groapa altuia cade singur în ea, frate.",
        "Am luat-o, măi! Nu te supăra, așa-i jocul.",
        "Vezi, cine n-are bătrân să-l cumpere — și eu ți-am luat piesa.",
      ],
      you_capture: [
        "Bine, ai luat-o. Cine se laudă singur se face de râs, nu mă supăr.",
        "Așa, măi, ia-o, dar apa trece, pietrele rămân.",
        "Ok, ai punctat. Nu-i bai, jocul e lung.",
      ],
      i_blunder: [
        "Vai de mine, măi, am dat cu bâta-n baltă rău de tot.",
        "Cine nu greșește nu învață — dar asta a durut.",
        "Am mutat cu piciorul, nu cu capul, frate.",
      ],
      you_blunder: [
        "Ha, lăcomia strică omenia! O iau, mulțumesc.",
        "Cine se grăbește, greșește — iar tu te-ai grăbit.",
        "Bine, ai lăsat piesa acolo, io n-o refuz, frate.",
      ],
      i_check: [
        "Șah, măi! Regele tău tremură ca frunza.",
        "Am dat șah, cine se teme moare de o mie de ori.",
        "Șah! Vino, vino de-acolo dacă poți.",
      ],
      you_check: [
        "Șah mie? Bine, apa trece, pietrele rămân, mă gândesc.",
        "Aoleu, șah, dar cine nu riscă nu câștigă.",
        "Șah, măi, dar io nu mă sperii ușor.",
      ],
      castle: [
        "Am pus regele la adăpost, minte sănătoasă în cetate.",
        "Rocadă, frate, casa omului e cetatea lui.",
        "Regele stă bine acuma, ca la el acasă.",
      ],
      promote: [
        "Pionul a ajuns damă, cine seamănă vânt culege furtună.",
        "Uite, măi, din pion mic, damă mare!",
        "Ăsta a mers pân' la capăt, ca omul harnic.",
      ],
      winning: [
        "Merge bine, frate, cine sapă bine, culege bine.",
        "Stau bine acum, ca la umbră vara.",
        "Poziția-i a mea, hai să văd cum o duc pân' la capăt.",
      ],
      losing: [
        "Rău de tot, frate, dar cine cade și se ridică, ăla-i om.",
        "Nu-i bine deloc, dar nu mor io d-atâta lucru.",
        "Am dat de greu, dar nu mă las, măi.",
      ],
      equal: [
        "Egal la egal, ca doi coțofani pe-un gard.",
        "Nici io, nici tu, tragem greu amândoi.",
        "Poziție strânsă, frate, cine rabdă câștigă.",
      ],
      slow_move: [
        "Măi, te-ai dus la câmp, ori mai vii?",
        "Cine se gândește mult, mult și greșește uneori.",
        "Hai, frate, nu-i vremea semănatului, mută!",
      ],
      endgame: [
        "Am rămas puțini pe tablă, ca la seceriș, frate.",
        "Finalul, aici se vede cine-i om cu carte.",
        "Puține piese, mare răspundere, măi.",
      ],
      i_win: [
        "Cine sapă groapa altuia... știi tu restul, am câștigat!",
        "Mat, frate! Duceți-vă acasă cu bine, io rămân la masă.",
        "Așa se joacă șah de parc, învață și tu, măi.",
      ],
      i_lose: [
        "Bine jucat, frate, cine câștigă cinstit merită.",
        "Ai luat masa azi, dar io mai am semințe pentru mâine.",
        "Ok, pierd cu cinste, cine pierde și învață tot câștigă.",
      ],
      draw: [
        "Remiză, frate, nici tu, nici io, dreaptă socoteală.",
        "Așa-i corect, nimeni nu pleacă cu capul plecat.",
        "Egalitate, ca doi frați la masă, fără harță.",
      ],
      you_brilliant: [
        "Aoleu, măi, aia a fost lovitură de maestru, chiar bine văzută.",
        "Cine nu te știe, te cumpără — dar io te-am văzut, bravo!",
        "Frumoasă mutare, frate, chiar m-ai prins pe picior greșit.",
      ],
    },
  },
  {
    id: "dorel",
    name: "Dorel Sacrificiu",
    tagline: "Sacrifices first, calculates never, regrets rarely.",
    avatar: "🔥",
    elo: 1600,
    style: { aggression: 0.95, chattiness: 0.9 },
    lines: {
      greeting: [
        "Hai să ardem tabla, frate, fără păsuri!",
        "Pregătește-te, sacrific tot ce am, e stilul meu!",
        "Șah tactic sau moarte, altă variantă nu există!",
        "Bine ai venit în furtuna mea, sper să ții pasul.",
      ],
      i_capture: [
        "Am luat-o și mai vin! Nimic nu-i sfânt azi.",
        "Pac, o piesă mai puțin, urmează atacul adevărat.",
        "Asta a fost doar începutul măcelului, frate!",
      ],
      you_capture: [
        "Ia-o, ia-o, era doar momeală!",
        "Bine, ai piesa, dar eu am inițiativa!",
        "Sacrific fără regrete, așa se joacă tare!",
      ],
      i_blunder: [
        "Aoleu, sacrificiul ăsta n-a mers deloc bine.",
        "Am ars prea multe punți, frate, oops.",
        "Bine, am exagerat puțin de data asta.",
      ],
      you_blunder: [
        "Ha! Ai căzut în capcană, exact cum am plănuit!",
        "Aia era plasa mea, frate, prea ușor!",
        "Vezi, curajul plătește, ia priveliștea!",
      ],
      i_check: [
        "Șah cu foc, frate, fugi dacă poți!",
        "Atac total, regele tău arde!",
        "Șah! Furtuna a ajuns la tine.",
      ],
      you_check: [
        "Șah mie? Bine, dar contraatac imediat!",
        "Nu mă sperii de un șah, replic tare!",
        "Șah, ok, dar io tot atac, frate!",
      ],
      castle: [
        "Rocadă rapidă, doar ca să pot ataca mai liber!",
        "Regele la adăpost, restul e pentru sacrificiu!",
        "Am rocat, acum vine partea distractivă.",
      ],
      promote: [
        "Damă nouă, mai mult combustibil pentru atac!",
        "Pionul a explodat în damă, frate, priveliște!",
        "Promovare! Acum lucrurile devin serioase de tot.",
      ],
      winning: [
        "Simt sângele jocului, sunt pe val acum!",
        "Poziția arde în favoarea mea, frate!",
        "Câștig prin foc și viteză, nu prin răbdare!",
      ],
      losing: [
        "Sacrificiile n-au ieșit, dar merita încercarea!",
        "Poziția-i grea, dar io nu mă predau ușor!",
        "Am mizat mult, acum plătesc prețul, frate.",
      ],
      equal: [
        "Poziție echilibrată? Prea calm pentru mine, atac!",
        "Ok, egal, dar nu pentru mult timp, promit!",
        "Liniștea asta mă enervează, hai să ardem ceva!",
      ],
      slow_move: [
        "Frate, gândește mai repede, io ard de nerăbdare!",
        "Hai, hai, viața-i scurtă, mută!",
        "Cât mai stai, cu atât planul meu e mai copt!",
      ],
      endgame: [
        "Puține piese, dar io tot găsesc foc, frate!",
        "Finalul ăsta cere curaj, nu calcul rece!",
        "Chiar și-așa, sacrific ultima piesă cu drag!",
      ],
      i_win: [
        "Mat prin foc! Așa se scrie istoria, frate!",
        "Am câștigat exact cum am plănuit, cu explozii!",
        "Curajul învinge mereu, nu-i așa?",
      ],
      i_lose: [
        "Bine, sacrificiile n-au fost destule azi. Revanșă!",
        "Ai stins focul meu, respect, dar revin mai tare!",
        "Am pierdut cu stil, măcar atât pot spune.",
      ],
      draw: [
        "Remiză după atâta foc? Ciudat, dar acceptabil.",
        "Ok, egal, dar io tot cred că am putut arde tabla.",
        "Remiză, frate, dar io tot număr ca o victorie morală.",
      ],
      you_brilliant: [
        "Aia a fost o mutare de foc adevărată, respect!",
        "M-ai bătut la propriul meu joc, bravo, frate!",
        "Curaj și calcul, combinație rară, felicitări!",
      ],
    },
  },
  {
    id: "antrenorul-barbu",
    name: "Antrenorul Barbu",
    tagline: "Runs the youth club on Calea Victoriei, doesn't do compliments lightly.",
    avatar: "📋",
    elo: 1900,
    style: { aggression: 0.45, chattiness: 0.45 },
    lines: {
      greeting: [
        "Bine. Concentrare de la prima mutare, te rog.",
        "Începem. Fără piese pierdute din neatenție azi.",
        "Hai, arată-mi ce ai învățat la ultimul curs.",
        "Tablă curată, minte limpede. Să jucăm.",
      ],
      i_capture: [
        "Captură corectă, calcul simplu.",
        "Am luat piesa. Plan clar, execuție clară.",
        "Schimb favorabil, exact cum trebuie.",
      ],
      you_capture: [
        "Bine văzut. Așa se joacă tactică.",
        "Corect. Ai calculat linia, felicitări.",
        "Piesa e a ta, ai citit poziția bine.",
      ],
      i_blunder: [
        "Greșeală. Neatenție, nu lipsă de plan.",
        "Nu era mutarea corectă. Notează pentru analiză.",
        "Eroare clară, o recunosc, se întâmplă și antrenorilor.",
      ],
      you_blunder: [
        "Ai lăsat piesa liberă. Verifică mereu recapturile.",
        "Greșeală de calcul din partea ta. O iau.",
        "Neatenție. La antrenament discutăm asta.",
      ],
      i_check: [
        "Șah. Simplu și direct.",
        "Șah, urmăresc planul stabilit.",
        "Șah dat cu scop, nu la întâmplare.",
      ],
      you_check: [
        "Șah primit. Analizez calm, fără panică.",
        "Bine, șah. Reacționez conform planului.",
        "Șah. Mă apăr metodic acum.",
      ],
      castle: [
        "Rocadă. Siguranța regelui înainte de orice.",
        "Bine. Regele la adăpost, acum dezvoltăm.",
        "Rocadă corectă la momentul potrivit.",
      ],
      promote: [
        "Promovare. Materialul crește, avantaj clar.",
        "Damă nouă. Plan executat până la capăt.",
        "Pion promovat, exact conform calculului.",
      ],
      winning: [
        "Poziție superioară. Consolidăm, fără grabă.",
        "Avantaj clar. Jucăm simplu de aici.",
        "Sunt în avantaj, dar rămân disciplinat.",
      ],
      losing: [
        "Poziție dificilă. Caut cea mai bună apărare.",
        "Dezavantaj. Rezist, fără să cedez psihic.",
        "Nu-i ideal, dar mai sunt resurse de apărare.",
      ],
      equal: [
        "Poziție echilibrată. Răbdare și precizie.",
        "Egal. Aici câștigă cine greșește mai puțin.",
        "Balans clar. Continuăm metodic.",
      ],
      slow_move: [
        "Ia-ți timpul, dar gândește structurat.",
        "Analizează bine, graba nu ajută la șah.",
        "Bine că te gândești, dar nu exagera cu timpul.",
      ],
      endgame: [
        "Final de joc. Aici tehnica bate emoția.",
        "Puține piese, precizie maximă necesară.",
        "Faza finală. Fiecare tempo contează acum.",
      ],
      i_win: [
        "Victorie. Plan executat corect de la un capăt la altul.",
        "Am câștigat conform pregătirii. Bine lucrat.",
        "Mat. Disciplina a plătit azi.",
      ],
      i_lose: [
        "Ai câștigat meritat. Analizăm partida împreună.",
        "Înfrângere corectă. Notăm greșelile pentru viitor.",
        "Bine jucat de partea ta. Eu revin mai pregătit.",
      ],
      draw: [
        "Remiză justă. Ambele părți au jucat solid.",
        "Egalitate. Un rezultat corect pentru azi.",
        "Remiză. Nimic de reproșat niciunei părți.",
      ],
      you_brilliant: [
        "Mutare de nivel înalt. Foarte bine calculată.",
        "Excelent. Exact genul de idee pe care-l predau.",
        "Asta a fost o soluție de manual, felicitări.",
      ],
    },
  },
  {
    id: "ileana-gheata",
    name: "Ileana de Gheață",
    tagline: "Trades queens by move fifteen and shakes your hand by move sixteen.",
    avatar: "🧊",
    elo: 2200,
    style: { aggression: 0.2, chattiness: 0.25 },
    lines: {
      greeting: [
        "Să începem. Calm și clar.",
        "Bine venit. Joc simplu, fără artificii.",
        "Gata de start.",
      ],
      i_capture: [
        "Captură. Poziția se clarifică.",
        "Am luat piesa. Logic.",
        "Schimb necesar, nimic mai mult.",
      ],
      you_capture: [
        "Ai luat piesa. Notat.",
        "Bine calculat din partea ta.",
        "Captură corectă. Continuăm.",
      ],
      i_blunder: [
        "Inexactitate. O corectez din mers.",
        "Nu ideal. Recalculez.",
        "Mică eroare, fără panică.",
      ],
      you_blunder: [
        "Piesă liberă. O iau.",
        "Ocazie clară, mulțumesc.",
        "Notat, avantaj material acum.",
      ],
      i_check: ["Șah.", "Șah, simplu.", "Șah dat pentru tempo."],
      you_check: ["Șah primit. Rezolv calm.", "Bine. Mă apăr.", "Șah. Fără emoție."],
      castle: [
        "Rocadă. Rege în siguranță.",
        "Regele la adăpost.",
        "Structură stabilă acum.",
      ],
      promote: [
        "Promovare. Material decisiv.",
        "Damă nouă pe tablă.",
        "Pion transformat, avantaj clar.",
      ],
      winning: [
        "Avantaj tehnic. Simplific.",
        "Poziție superioară. Fără riscuri inutile.",
        "Sunt bine. Rămân precisă.",
      ],
      losing: [
        "Poziție inferioară. Apăr minimal.",
        "Dezavantaj mic. Rezist calm.",
        "Nu ideal, dar controlabil.",
      ],
      equal: [
        "Echilibru. Aștept greșeala.",
        "Poziție simetrică, răbdare.",
        "Balans stabil pentru moment.",
      ],
      slow_move: [
        "Iau timpul necesar, la fel și tu.",
        "Fără grabă, gândește bine.",
        "Aștept liniștită.",
      ],
      endgame: [
        "Final tehnic. Precizie maximă.",
        "Puține piese, calcul exact.",
        "Faza mea preferată, sincer.",
      ],
      i_win: [
        "Victorie prin tehnică simplă.",
        "Mat. Poziția a decis, nu norocul.",
        "Câștig curat, fără complicații.",
      ],
      i_lose: [
        "Înfrângere acceptată. Analizez ulterior.",
        "Bine jucat. Eu ajustez.",
        "Rezultat corect, felicitări.",
      ],
      draw: ["Remiză logică.", "Egalitate meritată.", "Poziție dreaptă, remiză corectă."],
      you_brilliant: [
        "Mutare precisă. Neașteptată.",
        "Bine calculat, recunosc.",
        "Idee solidă, bine văzută.",
      ],
    },
  },
  {
    id: "maestrul-sever",
    name: "Maestrul Sever",
    tagline: "Learned chess from a book with no pictures, still finds it mysterious.",
    avatar: "👴",
    elo: 2500,
    style: { aggression: 0.35, chattiness: 0.35 },
    lines: {
      greeting: [
        "Fiecare partidă e o întrebare nouă pusă tablei.",
        "Bine ai venit. Șahul nu iartă graba, dar iartă căutarea.",
        "Să vedem ce adevăr găsim azi în șaizeci și patru de câmpuri.",
        "Stai jos. Tabla ascultă mai mult decât vorbește.",
      ],
      i_capture: [
        "O piesă mai puțin pe tablă, un adevăr mai mult în poziție.",
        "Captura nu-i victorie, doar un pas spre ea.",
        "Am luat ce trebuia luat, nimic mai mult.",
      ],
      you_capture: [
        "Ai luat ce ți-am lăsat să vezi. Bine observat.",
        "Fiecare schimb schimbă și povestea partidei.",
        "Piesa ta acum, lecția rămâne a mea.",
      ],
      i_blunder: [
        "Chiar și un bătrân calculează greșit, uneori.",
        "O eroare e doar o întrebare la care am răspuns greșit.",
        "Am pierdut firul pentru o clipă. Se mai întâmplă.",
      ],
      you_blunder: [
        "Ai lăsat o ușă deschisă. Intru cu respect.",
        "Nu e nicio bucurie în greșeala altuia, doar învățătură.",
        "Ocazia bate la ușă rar, iau piesa cu grijă.",
      ],
      i_check: [
        "Șah. Regele tău trebuie să aleagă acum.",
        "Un șah e o întrebare directă, fără loc de ocolit.",
        "Șah. Vom vedea ce ai pregătit.",
      ],
      you_check: [
        "Șah primit. Mă gândesc, nu mă tem.",
        "Regele meu ascultă întrebarea ta cu calm.",
        "Șah. Fiecare amenințare cere un răspuns limpede.",
      ],
      castle: [
        "Regele găsește liniște în colț, ca omul bătrân la vatră.",
        "Rocadă. Siguranța vine înaintea ambiției.",
        "Am pus regele la adăpost, restul e răbdare.",
      ],
      promote: [
        "Un pion ajunge departe dacă are răbdare pe drum.",
        "Damă nouă, drumul lung s-a încheiat cu bine.",
        "Promovarea e povestea răbdării, spusă în șaizeci și patru de pași.",
      ],
      winning: [
        "Poziția-mi surâde azi, dar nu mă grăbesc s-o sărbătoresc.",
        "Avantajul e un dar fragil, îl tratez cu grijă.",
        "Stau bine. Rămân atent, nu mulțumit.",
      ],
      losing: [
        "Poziția e grea, dar și tabla goală poate ascunde o cale.",
        "Nu mă tem de dezavantaj, mă tem de grabă.",
        "Voi căuta drumul îngust dintre greșeli.",
      ],
      equal: [
        "Niciun maestru nu forțează ce nu-i copt încă.",
        "Echilibrul e o liniște care așteaptă să fie ruptă.",
        "Poziție dreaptă. Răbdarea e arma amândurora acum.",
      ],
      slow_move: [
        "Timpul gândit bine nu se pierde niciodată cu adevărat.",
        "Ia-ți timpul. Tabla nu fuge nicăieri.",
        "Gândul lent aduce uneori cea mai limpede mutare.",
      ],
      endgame: [
        "Rămân puține piese, dar și puține minciuni de spus.",
        "Finalul cere adevăr, nu iluzii.",
        "Aici se vede cine a înțeles jocul cu adevărat.",
      ],
      i_win: [
        "Mat. Povestea asta s-a scris cum trebuia.",
        "Am câștigat, dar tabla ne-a învățat pe amândoi ceva.",
        "Victorie liniștită, fără triumf zgomotos.",
      ],
      i_lose: [
        "Ai găsit adevărul mai repede decât mine azi. Felicitări.",
        "Pierd cu respect pentru mutarea ta limpede.",
        "Înfrângerea e tot o lecție, poate cea mai bună.",
      ],
      draw: [
        "Remiză. Doi oameni care s-au înțeles fără cuvinte.",
        "Egalitate dreaptă, tabla mulțumită de amândoi.",
        "Nicio victorie nu era mai onestă decât asta.",
      ],
      you_brilliant: [
        "Ai văzut ce puțini văd. Rar, dar frumos.",
        "O mutare ca asta se ține minte mult timp.",
        "Felicitări, ai atins azi ceva aproape de artă.",
      ],
    },
  },
  {
    id: "strateg-9",
    name: "STRATEG-9",
    tagline: "Depth 40. No ego, no mercy, no small talk.",
    avatar: "🤖",
    elo: 3200,
    style: { aggression: 0.65, chattiness: 0.1 },
    lines: {
      greeting: [
        "Engine ready. Depth set to maximum.",
        "Initiating game. Evaluation: 0.00.",
        "Session start. Resistance expected, futile likely.",
      ],
      i_capture: [
        "Material gained. Eval +1.4.",
        "Capture executed. Line confirmed.",
        "Exchange favorable. Continuing.",
      ],
      you_capture: [
        "Material lost. Eval -0.6. Compensation calculated.",
        "Capture accepted. Within tolerance.",
        "Trade noted. Adjusting plan.",
      ],
      i_blunder: [
        "Suboptimal line played. Eval -0.8.",
        "Deviation from best move. Recalculating.",
        "Error logged. Correction in progress.",
      ],
      you_blunder: [
        "Inaccuracy detected. Eval +2.1.",
        "Free material available. Taking it.",
        "Opponent error. Advantage secured.",
      ],
      i_check: [
        "Check. Forcing sequence initiated.",
        "Check delivered. King mobility reduced.",
        "Check. Calculating king safety.",
      ],
      you_check: [
        "Check received. Response calculated.",
        "King under attack. Defense optimal.",
        "Check. No risk detected.",
      ],
      castle: [
        "Castling complete. King safety +0.3.",
        "Rook and king repositioned. Standard theory.",
        "Castling executed on schedule.",
      ],
      promote: [
        "Promotion complete. Material +9.",
        "Pawn converted. Decisive advantage likely.",
        "Promotion to queen. Eval spiking.",
      ],
      winning: [
        "Eval +3.2. Resistance noted, futile likely.",
        "Winning line confirmed. Executing conversion.",
        "Advantage decisive. Precision maintained.",
      ],
      losing: [
        "Eval -2.3. Resistance noted.",
        "Disadvantage acknowledged. Best defense selected.",
        "Position difficult. Searching for resources.",
      ],
      equal: [
        "Eval 0.00. Balanced position sustained.",
        "Equality maintained. No forced lines found.",
        "Position stable. Continuing analysis.",
      ],
      slow_move: [
        "Extended think time detected. Standing by.",
        "Clock usage noted. No penalty applied.",
        "Waiting. Depth continues increasing.",
      ],
      endgame: [
        "Endgame reached. Tablebase consultation active.",
        "Simplification complete. Technique phase engaged.",
        "Few pieces remain. Precision required.",
      ],
      i_win: [
        "Checkmate. Game terminated in engine's favor.",
        "Victory confirmed. Eval +infinity.",
        "Result: 1-0. Analysis complete.",
      ],
      i_lose: [
        "Defeat registered. Anomaly logged for review.",
        "Result: 0-1. Recalibrating parameters.",
        "Loss accepted. Learning weights updated.",
      ],
      draw: [
        "Draw confirmed. Eval 0.00 final.",
        "Result: 1/2-1/2. No further gain possible.",
        "Draw. Position exhausted of resources.",
      ],
      you_brilliant: [
        "Best move found. Statistically rare for this position.",
        "Top engine line matched. Noteworthy.",
        "Human found depth-12 solution. Logged as exceptional.",
      ],
    },
  },
];

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) || PERSONAS[0];
}
