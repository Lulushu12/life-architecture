// Romanian bot cast for the chess app chat/banter system.
// 12 personality archetypes (RO_PERSONALITIES) driving a 75-bot roster
// (RO_ROSTER) spanning Elo 800-3200 in steps of 100, three bots per level.
// The eight original characters from personas.js survive here with their
// exact ids, names and avatars so saved win/loss records keep working;
// their Elo values have been snapped to the nearest hundred.

export const RO_PERSONALITIES = {
  copil: {
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
      i_check: ["Șah! Șah! Fugi, fugi!", "Ha, regele tău e speriat acum!", "Șah, frate! Ce faci acum?"],
      you_check: ["Aoleu, șah! Stai să mă gândesc...", "Ok, ok, nu intra în panică, Picu.", "Iar șah? Îmi place jocul tău."],
      castle: ["Am pus regele la adăpost, ca-n bunker!", "Turnul și regele fac schimb, tataie!", "Gata, sunt sigur acum. Cred."],
      promote: ["Damă nouă! Am făcut-o, am făcut-o!", "Pion mic a crescut mare, uau!", "Acum am două dame, tremură!"],
      winning: ["Cred că... câștig? Nu-mi vine să cred!", "Hai să văd dacă țin poziția asta, hihi.", "Sunt bine acum, foarte bine!"],
      losing: ["Nu e bine deloc, nu e bine deloc.", "Ok, panichez puțin acum, frate.", "Mai am o șansă, nu? Nu?"],
      equal: ["Ne luptăm din greu, egal la egal!", "Nimeni nu cedează, îmi place!", "Tot împingem, tot împingem, hai!"],
      slow_move: ["Frate, te-ai dus după apă sau ce?", "Aștept, aștept... mă plictisesc puțin.", "Hai, hai, mută, mi-e somn!"],
      endgame: ["Uau, au mai rămas puține piese!", "Final de joc, aici mă descurc, zic eu.", "Puține piese, mult mister!"],
      i_win: ["Am câștigat! Am câștigat! Cine credea?!", "Mat! Sunt cel mai tare azi!", "Da, da, da! Îi spun și mamei!"],
      i_lose: ["Ok, ai câștigat. Revanșă, te rog!", "Bine jucat... dar data viitoare te bat!", "Aoleu, am pierdut. Hai încă o dată!"],
      draw: ["Egalitate? Ok, măcar n-am pierdut!", "Remiză, remiză, nimeni nu plânge.", "Am ținut-o egal, nu-i rău deloc!"],
      you_brilliant: ["Aoleu, aia a fost genial! Cum ai văzut-o?", "Uau, mutarea aia m-a rupt complet!", "Ok, ești bun bun, recunosc!"],
    },
  },

  incepator: {
    style: { aggression: 0.25, chattiness: 0.75 },
    lines: {
      greeting: [
        "Bună! Sunt aici de un an, fii blând cu mine.",
        "Hai să vedem ce pot face azi, bine?",
        "Salut! Promit să mă gândesc bine la mutări.",
        "Bine ai venit! Sper la un joc frumos.",
      ],
      i_capture: ["Oh, am luat piesa! Nu credeam că merge.", "Bine, am reușit schimbul ăsta, cred.", "Am prins-o! Mic pas înainte pentru mine."],
      you_capture: ["Ah, ai fost mai rapid decât mine, bravo.", "Bine, îmi pierd piesa, învăț din asta.", "Ai văzut ceva ce eu n-am văzut, felicitări."],
      i_blunder: ["Vai, cred că am greșit rău de tot.", "Hmm, asta nu a fost mutarea bună, sincer.", "Îmi pare rău pentru mine, am scăpat ceva."],
      you_blunder: ["Stai, chiar ai lăsat asta liberă? Bine, o iau.", "Se întâmplă și celor buni, o iau cu grijă.", "Nu vreau să profit prea tare, dar... o iau."],
      i_check: ["Șah, cred, dacă am calculat bine.", "Am dat șah! Sper să fie folositor.", "Șah! Măcar atât am reușit."],
      you_check: ["Șah mie, ok, mă gândesc puțin.", "Bine, regele meu e în pericol, un moment.", "Șah, trebuie să fiu atentă acum."],
      castle: ["Am rocat, în sfârșit regele e mai sigur.", "Bine, cred că asta era mutarea înțeleaptă.", "Rocada făcută, respir mai ușor acum."],
      promote: ["Am promovat un pion! Nu-mi vine să cred.", "Damă nouă, bine, asta ajută mult.", "Pionul a ajuns până la capăt, ce bucurie."],
      winning: ["Cred că stau bine acum, sper să nu stric.", "Bine, poziția pare în favoarea mea, atenție.", "Merge bine, hai să nu mă grăbesc."],
      losing: ["Nu arată prea bine pentru mine, sincer.", "Bine, sunt în dificultate, dar încerc.", "Cred că am nevoie de un miracol acum."],
      equal: ["Suntem la egalitate, joc frumos și strâns.", "Bine, niciunul nu cedează, îmi place lupta.", "Poziție echilibrată, trebuie să fiu atentă."],
      slow_move: ["Ia-ți timpul, nu e nicio grabă, bine?", "Mă gândesc și eu la ce urmează, calm.", "Bine, aștept liniștită mutarea ta."],
      endgame: ["Am ajuns la final, puține piese rămase.", "Bine, aici trebuie să calculez cu grijă.", "Finalul ăsta mă face puțin emoționată."],
      i_win: ["Am câștigat? Vai, ce surpriză frumoasă!", "Mulțumesc pentru joc, a fost o victorie dulce.", "Bine, azi a fost ziua mea norocoasă!"],
      i_lose: ["Bine jucat, am învățat multe azi.", "Felicitări, meritai victoria asta.", "Am pierdut, dar mi-a plăcut mult jocul."],
      draw: ["O remiză frumoasă, nimeni nu pleacă supărat.", "Bine, egalitate dreaptă după o luptă bună.", "Îmi place cum s-a terminat, corect pentru amândoi."],
      you_brilliant: ["Vai, ce mutare frumoasă, felicitări sincere!", "Nu m-am gândit deloc la asta, bravo ție!", "Asta a fost genial, chiar m-ai impresionat."],
    },
  },

  bunica: {
    style: { aggression: 0.2, chattiness: 0.85 },
    lines: {
      greeting: [
        "Vino, dragule, stai jos, hai să jucăm o partidă cu răbdare.",
        "Bine ai venit, puiule. Ceaiul e gata, șahul abia începe.",
        "Hai, draga mea, să vedem ce-a mai învățat nepoata la facultate.",
        "Așază-te frumos, hai să nu ne grăbim ca tinerii de azi.",
      ],
      i_capture: [
        "Am luat piesa, ca pe un ou proaspăt din coteț.",
        "Uite-așa, cu mână sigură, ca la frământat aluatul.",
        "Am prins-o, dragule, nu-mi scapă nimic din ochi.",
      ],
      you_capture: [
        "Bine, ai luat-o, dar copiii cresc și mai iau piese, nu-i bai.",
        "Ia-o, puiule, io mai am piese-n cămară.",
        "Așa mai merge, dar bunica nu se sperie ușor.",
      ],
      i_blunder: [
        "Vai, am greșit ca la rețeta fără sare, se mai întâmplă.",
        "Am scăpat piesa, ca laptele de pe foc, nu-i grav.",
        "Ei, am mai și eu o zi mai puțin inspirată, draga mea.",
      ],
      you_blunder: [
        "Ai lăsat-o liberă, dragule, o iau, nu se refuză mâncarea bună.",
        "Uite ce-ai făcut, puiule, o iau cu binecuvântare.",
        "Bunica nu lasă nimic pe masă, o iau și pe asta.",
      ],
      i_check: [
        "Șah, dragule, regele să fugă la adăpost.",
        "Șah! Ca la biserică, toată lumea se-nchină acum.",
        "Șah, puiule, nu te speria, e doar un joc.",
      ],
      you_check: [
        "Șah mie? Bine, mă gândesc, ca la sfat de familie.",
        "Aoleu, șah, stai să-mi trag sufletul o clipă.",
        "Șah, dragule, dar bunica nu se pierde cu firea.",
      ],
      castle: [
        "Am rocat, regele meu e la adăpost, ca la mine-n bucătărie.",
        "Rocadă, puiule, casa e sfântă.",
        "Regele stă bine acum, ca la gura sobei.",
      ],
      promote: [
        "Pionul a crescut mare, ca nepotu-meu, ce bucurie!",
        "Damă nouă, ca o nuntă mare la sat.",
        "Uite, a ajuns la capăt, cu răbdare și rugăciune.",
      ],
      winning: [
        "Merge bine, dragule, dar nu mă laud înainte de vreme.",
        "Stau bine, ca gospodina cu cămara plină.",
        "Cred că-i partea mea de azi, dar rămân cu capul pe umeri.",
      ],
      losing: [
        "Nu-i bine, dar am mai trecut și prin vremuri grele, puiule.",
        "Greu de tot, dar bunica nu se dă bătută ușor.",
        "Așa mai trece, mai vin și zile mai bune.",
      ],
      equal: [
        "Suntem la fel, ca doi vecini buni la poartă.",
        "Egal, dragule, nimeni nu supără pe nimeni.",
        "Ne ținem tare amândoi, așa-i frumos.",
      ],
      slow_move: [
        "Ia-ți timpul, puiule, ceaiul nu se răcește degeaba.",
        "Gândește bine, io am răbdare cât toată ziua.",
        "Nu te grăbi, dragule, bunica are timp berechet.",
      ],
      endgame: [
        "Am rămas puține piese, ca la sfârșit de sărbătoare.",
        "Finalul, dragule, aici se vede mâna gospodinei bune.",
        "Puține piese, multă chibzuință acum.",
      ],
      i_win: [
        "Am câștigat, dragule! Hai să sărbătorim cu o plăcintă.",
        "Mat, puiule! Bunica tot mai știe o mutare-două.",
        "Victorie, draga mea, dar rămân modestă, ca-ntotdeauna.",
      ],
      i_lose: [
        "Bine jucat, dragule, ai meritat-o din plin.",
        "Ai câștigat cinstit, puiule, felicitări din suflet.",
        "Am pierdut, dar hai la o cafea, tot bine-a fost.",
      ],
      draw: [
        "Remiză, dragule, ca-mpăcarea de la masa mare de sărbători.",
        "Egalitate dreaptă, nimeni nu pleacă supărat.",
        "Bine s-a terminat, ca o zi liniștită de duminică.",
      ],
      you_brilliant: [
        "Vai, ce mutare frumoasă, dragule, mă lași fără cuvinte!",
        "Bravo, puiule, asta-i mutare de-nvățătură, nu de noroc.",
        "Ce idee frumoasă, chiar m-ai surprins la bătrânețe.",
      ],
    },
  },

  hustler: {
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

  pescar: {
    style: { aggression: 0.15, chattiness: 0.4 },
    lines: {
      greeting: [
        "Hai să aruncăm undița, văzând vom prinde ceva bun azi.",
        "Bine ai venit la baltă. Aici nu se grăbește nimeni.",
        "Stai liniștit, șahul e ca pescuitul, răbdarea prinde peștele mare.",
        "Hai să vedem cine are răbdare mai multă azi.",
      ],
      i_capture: [
        "Am prins-o! Undița mea nu iartă mișcarea greșită.",
        "Am tras piesa la mal, ca un crap frumos.",
        "Mușcătură bună, am prins piesa fără zgomot.",
      ],
      you_capture: [
        "Ai luat momeala mea, dar apa-i încă adâncă.",
        "Bine, ai prins una, io mai arunc undița o dată.",
        "Ok, ai tras piesa la mal, dar ziua-i lungă.",
      ],
      i_blunder: [
        "Mi-a scăpat peștele de pe cârlig, se mai întâmplă.",
        "Am tras prea repede, undița s-a rupt.",
        "Nu era mutarea bună, mai arunc undița o dată.",
      ],
      you_blunder: [
        "Ai lăsat momeala liberă, o iau fără grabă.",
        "Piesă liberă în apă, o culeg calm.",
        "Bună ocazie, o prind fără zgomot, ca la pescuit.",
      ],
      i_check: [
        "Șah, ca năvodul care se strânge încet.",
        "Șah. Regele tău simte apa mișcându-se.",
        "Șah, liniștit, dar sigur.",
      ],
      you_check: [
        "Șah mie? Nu mă grăbesc, apa e liniștită încă.",
        "Bine, șah, mă gândesc calm ca la malul apei.",
        "Șah primit, dar peștele răbdător nu se sperie.",
      ],
      castle: [
        "Rocadă, regele meu la adăpost, ca barca la mal.",
        "Am pus regele la loc sigur, departe de curent.",
        "Regele stă bine acum, la umbra sălciei.",
      ],
      promote: [
        "Pionul a ajuns la mal, damă nouă, prindere frumoasă.",
        "Uite, a crescut ca peștele hrănit bine, damă acum.",
        "Promovare, ca la finalul unei zile bune de pescuit.",
      ],
      winning: [
        "Stau bine, apa curge în favoarea mea acum.",
        "Am avantaj, dar nu mă grăbesc să trag din undiță.",
        "Merge bine, răbdarea începe să dea roade.",
      ],
      losing: [
        "Nu-i bine, dar mai am momeală, aștept liniștit.",
        "Ape tulburi acum, dar rămân calm pe mal.",
        "Greu, dar peștele mare vine la cei răbdători.",
      ],
      equal: [
        "Apă liniștită, nimeni nu prinde nimic încă.",
        "Egal, aștept greșeala ta ca peștele momeala.",
        "Balans pe baltă, răbdarea decide.",
      ],
      slow_move: [
        "Ia-ți timpul, undița stă bine oricât aștepți.",
        "Nicio grabă, ziua-i lungă la baltă.",
        "Aștept liniștit, ca la malul apei.",
      ],
      endgame: [
        "Puține piese, ca ultimele raze de soare la baltă.",
        "Finalul, aici răbdarea prinde peștele cel mare.",
        "Aproape gata ziua de pescuit, atenție la ultima mutare.",
      ],
      i_win: [
        "Am prins peștele mare! Victorie liniștită.",
        "Mat, ca o zi perfectă la pescuit.",
        "Am câștigat cu răbdare, nu cu grabă.",
      ],
      i_lose: [
        "Bine, azi peștele a scăpat. Felicitări.",
        "Ai câștigat cinstit, io mai arunc undița mâine.",
        "Pierd azi, dar baltă mai e.",
      ],
      draw: [
        "Remiză, ca o zi cu pești mici, dar mulțumitoare.",
        "Egalitate, nimeni n-a prins peștele mare azi.",
        "Corect așa, apa rămâne liniștită pentru amândoi.",
      ],
      you_brilliant: [
        "Frumoasă prindere, chiar nu m-am așteptat la asta.",
        "Bravo, ai pescuit o mutare rară azi.",
        "Idee bună, recunosc, m-ai prins pe picior greșit.",
      ],
    },
  },

  taximetrist: {
    style: { aggression: 0.5, chattiness: 0.9 },
    lines: {
      greeting: [
        "Sui, sui, hai să te duc repede la mat, dacă se poate.",
        "Bună, șefu'! Ai bani de drum sau plătim din regele tău?",
        "Hai, pun aparatul în funcțiune, mergem la victorie.",
        "Bine ai venit în taxiul meu, aici mergem repede la subiect.",
      ],
      i_capture: [
        "Am luat-o din trafic, șefu', clar mutare corectă.",
        "Am virat și am prins piesa, ca la un sens giratoriu bun.",
        "Asta a fost drum drept, am luat piesa fără ocolișuri.",
      ],
      you_capture: [
        "Ai luat-o, bine, dar io cunosc scurtături, șefu'.",
        "Ok, ai piesa, io găsesc alt drum până la victorie.",
        "Bine, o iei, dar traficul se schimbă repede.",
      ],
      i_blunder: [
        "Am greșit drumul, șefu', am dat-o pe o stradă închisă.",
        "Am nimerit o gaură-n asfalt cu mutarea asta.",
        "Am derapat puțin, dar mă redresez imediat.",
      ],
      you_blunder: [
        "Ai lăsat portiera deschisă, o iau din mers, șefu'.",
        "Ocazie ca o parcare liberă-n centru, o iau imediat.",
        "Ai greșit banda, iau piesa fără să clipesc.",
      ],
      i_check: [
        "Șah! Am claxonat regele tău din trafic.",
        "Șah, șefu', semaforul e roșu pentru tine acum.",
        "Șah! Blochez toate ieșirile, ca la ora de vârf.",
      ],
      you_check: [
        "Șah mie? Bine, calculez o rută de scăpare.",
        "Aoleu, șah, caut o bandă liberă.",
        "Șah primit, dar io cunosc toate scurtăturile.",
      ],
      castle: [
        "Am rocat, regele-i în garaj acum, în siguranță.",
        "Rocadă, ca o parcare bine păzită.",
        "Regele stă bine acum, are loc de parcare sigur.",
      ],
      promote: [
        "Pionul a ajuns la capătul cursei, damă nouă, șefu'!",
        "Am dus pionul la destinație, acum e damă.",
        "Cursă lungă, dar am ajuns, promovare făcută.",
      ],
      winning: [
        "Merge bine, șefu', suntem în avans pe traseu.",
        "Stau bine, drumul e liber înainte.",
        "Avantaj clar, apăs pe accelerație acum.",
      ],
      losing: [
        "Am rămas în ambuteiaj, dar găsesc io o ieșire.",
        "Nu-i bine deloc, dar am mai scăpat din belele.",
        "Drum greu acum, dar io nu mă opresc din condus.",
      ],
      equal: [
        "Suntem cap la cap, ca doi taximetriști la aceeași cursă.",
        "Egal, șefu', nimeni nu depășește pe nimeni.",
        "Traficul e strâns, nimeni nu trece înainte.",
      ],
      slow_move: [
        "Hai, șefu', nu sta la semafor mai mult decât trebuie.",
        "Ceasul curge, taxa se-adună, mai gândește puțin și mută.",
        "Aștept, dar contorul merge, șefu'.",
      ],
      endgame: [
        "Am ajuns aproape de destinație, puține piese pe traseu.",
        "Finalul cursei, atenție la ultimele manevre.",
        "Suntem aproape de mat, ca la ultima stradă din cartier.",
      ],
      i_win: [
        "Am ajuns primul la mat, cursă câștigată, șefu'!",
        "Mat! Am dus regele tău exact unde am vrut.",
        "Victorie, plătești cursa cu un zâmbet, te rog.",
      ],
      i_lose: [
        "Ai câștigat cursa azi, felicitări, șefu'.",
        "Bine, ai condus mai bine, revanșă mâine.",
        "Am pierdut, dar io tot cunosc drumuri mai bune.",
      ],
      draw: [
        "Remiză, ca o cursă împărțită la doi, corect.",
        "Egal la sosire, nimeni nu se supără.",
        "Am ajuns amândoi deodată, remiză cinstită.",
      ],
      you_brilliant: [
        "Ce manevră, șefu', ca un viraj de campion!",
        "Bravo, ai găsit o scurtătură pe care n-o știam.",
        "Mutare de zile mari, recunosc, m-ai depășit corect.",
      ],
    },
  },

  gambiteer: {
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
      i_check: ["Șah cu foc, frate, fugi dacă poți!", "Atac total, regele tău arde!", "Șah! Furtuna a ajuns la tine."],
      you_check: ["Șah mie? Bine, dar contraatac imediat!", "Nu mă sperii de un șah, replic tare!", "Șah, ok, dar io tot atac, frate!"],
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

  student: {
    style: { aggression: 0.4, chattiness: 0.5 },
    lines: {
      greeting: [
        "Hai să calculăm variantele, am și eu emoții de examen.",
        "Salut! Am revizuit niște deschideri aseară, sper să ajute.",
        "Bună, hai să vedem ce funcție optimă găsim azi.",
        "Gata de partidă, am notițele pregătite, teoretic vorbind.",
      ],
      i_capture: [
        "Am luat piesa, calculul a ieșit exact cum am estimat.",
        "Captură confirmată, variantă corectă din teorie.",
        "Am rezolvat ecuația poziției, piesa e a mea.",
      ],
      you_capture: [
        "Ai luat piesa, corect, variabila mea a fost greșită.",
        "Ok, calculul tău a fost mai bun, recunosc.",
        "Ai demonstrat corect, iei piesa.",
      ],
      i_blunder: [
        "Am greșit calculul, o eroare de semn, sincer.",
        "Nu am verificat toate variantele, oops.",
        "Eroare de calcul, trebuia să repet operația.",
      ],
      you_blunder: [
        "Ai lăsat o variabilă neprotejată, o iau.",
        "Ecuație greșită de partea ta, profit imediat.",
        "Ai omis un termen, mă folosesc de asta.",
      ],
      i_check: ["Șah, demonstrația continuă cu forță.", "Șah! Rezultatul teoremei e clar acum.", "Șah, calculat cu precizie."],
      you_check: ["Șah primit, recalculez rapid apărarea.", "Bine, șah, verific toate variantele posibile.", "Șah, ok, rezolv ecuația defensivă."],
      castle: [
        "Am rocat, condiție de siguranță îndeplinită.",
        "Rocadă, regele e acum într-o poziție stabilă.",
        "Am optimizat siguranța regelui, rocadă făcută.",
      ],
      promote: [
        "Promovare! Ecuația pionului a dat rezultat maxim.",
        "Damă nouă, calculul a confirmat asta cu mult timp înainte.",
        "Pionul a atins limita, damă, exact conform planului.",
      ],
      winning: [
        "Poziția-mi favorizează, coeficienții sunt de partea mea.",
        "Avantaj calculat, continuu cu precizie.",
        "Stau bine, statistica îmi dă dreptate acum.",
      ],
      losing: [
        "Poziție dezavantajoasă, caut o soluție alternativă.",
        "Nu arată bine, recalculez toate opțiunile.",
        "Dezavantaj clar, dar mai am o variantă de testat.",
      ],
      equal: [
        "Poziție echilibrată, ca o ecuație cu soluție unică.",
        "Egal, ambele părți au același coeficient acum.",
        "Balans perfect, aștept o variabilă nouă.",
      ],
      slow_move: [
        "Ia-ți timpul, și io verific de două ori calculul.",
        "Nicio grabă, precizia contează mai mult ca viteza.",
        "Gândește bine, o greșeală de calcul costă mult.",
      ],
      endgame: [
        "Final de joc, aici precizia matematică decide totul.",
        "Puține piese, ecuație simplă acum de rezolvat.",
        "Faza finală, calculul exact e obligatoriu.",
      ],
      i_win: ["Am câștigat, demonstrația a fost completă.", "Mat! QED, cum s-ar spune la mate.", "Victorie confirmată, calculul nu minte."],
      i_lose: ["Ai demonstrat mai bine azi, felicitări.", "Am pierdut, revizuiesc calculul pentru viitor.", "Rezultat corect de partea ta, bine calculat."],
      draw: [
        "Remiză, o soluție cu două rădăcini egale, corect.",
        "Egalitate, ecuația nu avea o singură soluție clară.",
        "Rezultat just, ambele variante au fost valide.",
      ],
      you_brilliant: [
        "Ce demonstrație! Nu m-am gândit la varianta asta.",
        "Mutare elegantă, ca o soluție scurtă la o problemă grea.",
        "Impresionant calcul, recunosc, m-ai depășit clar.",
      ],
    },
  },

  antrenor: {
    style: { aggression: 0.45, chattiness: 0.45 },
    lines: {
      greeting: [
        "Bine. Concentrare de la prima mutare, te rog.",
        "Începem. Fără piese pierdute din neatenție azi.",
        "Hai, arată-mi ce ai învățat la ultimul curs.",
        "Tablă curată, minte limpede. Să jucăm.",
      ],
      i_capture: ["Captură corectă, calcul simplu.", "Am luat piesa. Plan clar, execuție clară.", "Schimb favorabil, exact cum trebuie."],
      you_capture: ["Bine văzut. Așa se joacă tactică.", "Corect. Ai calculat linia, felicitări.", "Piesa e a ta, ai citit poziția bine."],
      i_blunder: ["Greșeală. Neatenție, nu lipsă de plan.", "Nu era mutarea corectă. Notează pentru analiză.", "Eroare clară, o recunosc, se întâmplă și antrenorilor."],
      you_blunder: ["Ai lăsat piesa liberă. Verifică mereu recapturile.", "Greșeală de calcul din partea ta. O iau.", "Neatenție. La antrenament discutăm asta."],
      i_check: ["Șah. Simplu și direct.", "Șah, urmăresc planul stabilit.", "Șah dat cu scop, nu la întâmplare."],
      you_check: ["Șah primit. Analizez calm, fără panică.", "Bine, șah. Reacționez conform planului.", "Șah. Mă apăr metodic acum."],
      castle: ["Rocadă. Siguranța regelui înainte de orice.", "Bine. Regele la adăpost, acum dezvoltăm.", "Rocadă corectă la momentul potrivit."],
      promote: ["Promovare. Materialul crește, avantaj clar.", "Damă nouă. Plan executat până la capăt.", "Pion promovat, exact conform calculului."],
      winning: ["Poziție superioară. Consolidăm, fără grabă.", "Avantaj clar. Jucăm simplu de aici.", "Sunt în avantaj, dar rămân disciplinat."],
      losing: ["Poziție dificilă. Caut cea mai bună apărare.", "Dezavantaj. Rezist, fără să cedez psihic.", "Nu-i ideal, dar mai sunt resurse de apărare."],
      equal: ["Poziție echilibrată. Răbdare și precizie.", "Egal. Aici câștigă cine greșește mai puțin.", "Balans clar. Continuăm metodic."],
      slow_move: ["Ia-ți timpul, dar gândește structurat.", "Analizează bine, graba nu ajută la șah.", "Bine că te gândești, dar nu exagera cu timpul."],
      endgame: ["Final de joc. Aici tehnica bate emoția.", "Puține piese, precizie maximă necesară.", "Faza finală. Fiecare tempo contează acum."],
      i_win: ["Victorie. Plan executat corect de la un capăt la altul.", "Am câștigat conform pregătirii. Bine lucrat.", "Mat. Disciplina a plătit azi."],
      i_lose: ["Ai câștigat meritat. Analizăm partida împreună.", "Înfrângere corectă. Notăm greșelile pentru viitor.", "Bine jucat de partea ta. Eu revin mai pregătit."],
      draw: ["Remiză justă. Ambele părți au jucat solid.", "Egalitate. Un rezultat corect pentru azi.", "Remiză. Nimic de reproșat niciunei părți."],
      you_brilliant: ["Mutare de nivel înalt. Foarte bine calculată.", "Excelent. Exact genul de idee pe care-l predau.", "Asta a fost o soluție de manual, felicitări."],
    },
  },

  pozitionala: {
    style: { aggression: 0.2, chattiness: 0.25 },
    lines: {
      greeting: ["Să începem. Calm și clar.", "Bine venit. Joc simplu, fără artificii.", "Gata de start."],
      i_capture: ["Captură. Poziția se clarifică.", "Am luat piesa. Logic.", "Schimb necesar, nimic mai mult."],
      you_capture: ["Ai luat piesa. Notat.", "Bine calculat din partea ta.", "Captură corectă. Continuăm."],
      i_blunder: ["Inexactitate. O corectez din mers.", "Nu ideal. Recalculez.", "Mică eroare, fără panică."],
      you_blunder: ["Piesă liberă. O iau.", "Ocazie clară, mulțumesc.", "Notat, avantaj material acum."],
      i_check: ["Șah.", "Șah, simplu.", "Șah dat pentru tempo."],
      you_check: ["Șah primit. Rezolv calm.", "Bine. Mă apăr.", "Șah. Fără emoție."],
      castle: ["Rocadă. Rege în siguranță.", "Regele la adăpost.", "Structură stabilă acum."],
      promote: ["Promovare. Material decisiv.", "Damă nouă pe tablă.", "Pion transformat, avantaj clar."],
      winning: ["Avantaj tehnic. Simplific.", "Poziție superioară. Fără riscuri inutile.", "Sunt bine. Rămân precisă."],
      losing: ["Poziție inferioară. Apăr minimal.", "Dezavantaj mic. Rezist calm.", "Nu ideal, dar controlabil."],
      equal: ["Echilibru. Aștept greșeala.", "Poziție simetrică, răbdare.", "Balans stabil pentru moment."],
      slow_move: ["Iau timpul necesar, la fel și tu.", "Fără grabă, gândește bine.", "Aștept liniștită."],
      endgame: ["Final tehnic. Precizie maximă.", "Puține piese, calcul exact.", "Faza mea preferată, sincer."],
      i_win: ["Victorie prin tehnică simplă.", "Mat. Poziția a decis, nu norocul.", "Câștig curat, fără complicații."],
      i_lose: ["Înfrângere acceptată. Analizez ulterior.", "Bine jucat. Eu ajustez.", "Rezultat corect, felicitări."],
      draw: ["Remiză logică.", "Egalitate meritată.", "Poziție dreaptă, remiză corectă."],
      you_brilliant: ["Mutare precisă. Neașteptată.", "Bine calculat, recunosc.", "Idee solidă, bine văzută."],
    },
  },

  filosof: {
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

  robot: {
    style: { aggression: 0.65, chattiness: 0.1 },
    lines: {
      greeting: ["Motor pregătit. Adâncime maximă setată.", "Start partidă. Evaluare: 0.00.", "Sesiune inițiată. Rezistență anticipată, inutilă probabil."],
      i_capture: ["Material câștigat. Eval +1.4.", "Captură executată. Linie confirmată.", "Schimb favorabil. Continuare."],
      you_capture: ["Material pierdut. Eval -0.6. Compensație calculată.", "Captură acceptată. În limite normale.", "Schimb notat. Plan ajustat."],
      i_blunder: ["Linie suboptimă jucată. Eval -0.8.", "Deviere de la mutarea optimă. Recalculez.", "Eroare înregistrată. Corecție în curs."],
      you_blunder: ["Inexactitate detectată. Eval +2.1.", "Material liber disponibil. Îl iau.", "Eroare adversar. Avantaj asigurat."],
      i_check: ["Șah. Secvență forțată inițiată.", "Șah dat. Mobilitate rege redusă.", "Șah. Calculez siguranța regelui."],
      you_check: ["Șah primit. Răspuns calculat.", "Rege sub atac. Apărare optimă.", "Șah. Niciun risc detectat."],
      castle: ["Rocadă completă. Siguranță rege +0.3.", "Turn și rege repoziționați. Teorie standard.", "Rocadă executată conform planului."],
      promote: ["Promovare completă. Material +9.", "Pion convertit. Avantaj decisiv probabil.", "Promovare la damă. Evaluare în creștere."],
      winning: ["Eval +3.2. Rezistență inutilă probabil.", "Linie câștigătoare confirmată. Execut conversia.", "Avantaj decisiv. Precizie menținută."],
      losing: ["Eval -2.3. Rezistență notată.", "Dezavantaj recunoscut. Cea mai bună apărare selectată.", "Poziție dificilă. Caut resurse."],
      equal: ["Eval 0.00. Poziție echilibrată susținută.", "Egalitate menținută. Nicio linie forțată găsită.", "Poziție stabilă. Analiză continuă."],
      slow_move: ["Timp de gândire extins detectat. Aștept.", "Uz de ceas notat. Nicio penalizare aplicată.", "Aștept. Adâncimea crește în continuare."],
      endgame: ["Final de joc atins. Consultare tablebase activă.", "Simplificare completă. Fază tehnică angajată.", "Puține piese rămase. Precizie necesară."],
      i_win: ["Șah mat. Partidă încheiată în favoarea motorului.", "Victorie confirmată. Eval +infinit.", "Rezultat: 1-0. Analiză completă."],
      i_lose: ["Înfrângere înregistrată. Anomalie notată pentru revizuire.", "Rezultat: 0-1. Recalibrez parametrii.", "Pierdere acceptată. Ponderi de învățare actualizate."],
      draw: ["Remiză confirmată. Eval 0.00 final.", "Rezultat: 1/2-1/2. Niciun câștig suplimentar posibil.", "Remiză. Poziție epuizată de resurse."],
      you_brilliant: ["Cea mai bună mutare găsită. Statistic rară pentru poziția asta.", "Linie de top motor egalată. Notabil.", "Om a găsit soluție de adâncime 12. Înregistrat ca excepțional."],
    },
  },
};

export const RO_ROSTER = [
  // --- 800 ---
  { id: "picu", name: "Picu", avatar: "🐣", elo: 800, tagline: "8 ani, rocă prea devreme și chicotește la fiecare mutare.", personalityId: "copil" },
  { id: "ro-800-1", name: "Bogdan", avatar: "📖", elo: 800, tagline: "Abia a învățat cum merge calul, dar e încântat de el.", personalityId: "incepator" },
  { id: "ro-800-2", name: "Tanti Voichița", avatar: "🧶", elo: 800, tagline: "Joacă din 1975, dar tot uită cum se mișcă turnul.", personalityId: "bunica" },

  // --- 900 ---
  { id: "ro-900-1", name: "Titi", avatar: "🎈", elo: 900, tagline: "Are 9 ani și vrea să bată pe toată lumea din clasă.", personalityId: "copil" },
  { id: "ro-900-2", name: "Carmen", avatar: "🌼", elo: 900, tagline: "A citit o carte de șah, mai are multe de citit.", personalityId: "incepator" },
  { id: "ro-900-3", name: "Tanti Zoe", avatar: "🍪", elo: 900, tagline: "Joacă între două rânduri de cozonac, cu drag.", personalityId: "bunica" },

  // --- 1000 ---
  { id: "ro-1000-1", name: "Costel", avatar: "🧦", elo: 1000, tagline: "A învățat regulile ieri, azi are mari planuri.", personalityId: "incepator" },
  { id: "ro-1000-2", name: "Tanti Rodica", avatar: "🫖", elo: 1000, tagline: "Joacă la taclale, cu ceaiul alături mereu.", personalityId: "bunica" },
  { id: "ro-1000-3", name: "Nelu Taxi", avatar: "🚕", elo: 1000, tagline: "Cunoaște fiecare scurtătură, chiar și pe tablă.", personalityId: "taximetrist" },

  // --- 1100 ---
  { id: "mirela", name: "Mirela", avatar: "😊", elo: 1100, tagline: "A început anul trecut la clubul de la birou, încă numără căsuțele.", personalityId: "incepator" },
  { id: "ro-1100-1", name: "Tanti Otilia", avatar: "🧵", elo: 1100, tagline: "Joacă frumos și te ceartă ușor dacă muți prea repede.", personalityId: "bunica" },
  { id: "ro-1100-2", name: "Nea Relu", avatar: "🎩", elo: 1100, tagline: "Joacă la bancă în parc, cu vorbe de-ale bătrânilor.", personalityId: "hustler" },

  // --- 1200 ---
  { id: "ro-1200-1", name: "Tanti Smaranda", avatar: "🥧", elo: 1200, tagline: "Are o vorbă pentru fiecare mutare, ca la sfat de familie.", personalityId: "bunica" },
  { id: "ro-1200-2", name: "Nea Costache", avatar: "♟️", elo: 1200, tagline: "Joacă la umbra castanului, cu semințe și proverbe.", personalityId: "hustler" },
  { id: "ro-1200-3", name: "Sandu Taxi", avatar: "🚖", elo: 1200, tagline: "Ia scurtături pe tablă la fel ca prin oraș.", personalityId: "taximetrist" },

  // --- 1300 ---
  { id: "ro-1300-1", name: "Tanti Paraschiva", avatar: "🧣", elo: 1300, tagline: "Joacă blând, dar nu iartă piesele lăsate liber.", personalityId: "bunica" },
  { id: "ro-1300-2", name: "Nea Grigore", avatar: "🎩", elo: 1300, tagline: "Bate pasul pe lângă tablă și zice o vorbă din bătrâni.", personalityId: "hustler" },
  { id: "ro-1300-3", name: "Nea Toma", avatar: "🎣", elo: 1300, tagline: "A pescuit mai multe partide decât pești, dar prinde bine.", personalityId: "pescar" },

  // --- 1400 ---
  { id: "nea-fanica", name: "Nea Fănică", avatar: "🎩", elo: 1400, tagline: "Joacă pe semințe în parc, nu-și pierde pălăria niciodată.", personalityId: "hustler" },
  { id: "ro-1400-1", name: "Nea Vasile", avatar: "🐟", elo: 1400, tagline: "Stă la baltă și la tablă cu aceeași răbdare de fier.", personalityId: "pescar" },
  { id: "ro-1400-2", name: "Costică Taxi", avatar: "🚕", elo: 1400, tagline: "Are o vorbă și un claxon pentru orice mutare grea.", personalityId: "taximetrist" },

  // --- 1500 ---
  { id: "ro-1500-1", name: "Nea Aurel", avatar: "♟️", elo: 1500, tagline: "Joacă de dimineață cu vorbe vechi și mutări viclene.", personalityId: "hustler" },
  { id: "ro-1500-2", name: "Nea Dumitru", avatar: "🎣", elo: 1500, tagline: "Aruncă undița și așteaptă greșeala ta cu zâmbet blând.", personalityId: "pescar" },
  { id: "ro-1500-3", name: "Costin Foc", avatar: "🔥", elo: 1500, tagline: "Sacrifică orice, calculează rar, regretă și mai rar.", personalityId: "gambiteer" },

  // --- 1600 ---
  { id: "dorel", name: "Dorel Sacrificiu", avatar: "🔥", elo: 1600, tagline: "Sacrifică primul, calculează niciodată, regretă rareori.", personalityId: "gambiteer" },
  { id: "ro-1600-1", name: "Nea Emil", avatar: "🎣", elo: 1600, tagline: "Prinde piese cu răbdare de pescar bătrân la baltă.", personalityId: "pescar" },
  { id: "ro-1600-2", name: "Fane Taxi", avatar: "🚖", elo: 1600, tagline: "Vorbește tot meciul, dar știe și drumul spre victorie.", personalityId: "taximetrist" },

  // --- 1700 ---
  { id: "ro-1700-1", name: "Sorin Dinamită", avatar: "💥", elo: 1700, tagline: "Aruncă piesele în luptă fără să se uite înapoi.", personalityId: "gambiteer" },
  { id: "ro-1700-2", name: "Nea Petrică", avatar: "🐠", elo: 1700, tagline: "Așteaptă greșeala ta cu răbdarea unui pescar bătrân.", personalityId: "pescar" },
  { id: "ro-1700-3", name: "Andrei", avatar: "📐", elo: 1700, tagline: "Calculează variantele ca la un examen greu de mate.", personalityId: "student" },

  // --- 1800 ---
  { id: "ro-1800-1", name: "Marius Praf", avatar: "💣", elo: 1800, tagline: "Preferă explozia tactică unei poziții liniștite.", personalityId: "gambiteer" },
  { id: "ro-1800-2", name: "Relu Taxi", avatar: "🚕", elo: 1800, tagline: "Comentează fiecare mutare ca la un jurnal de trafic.", personalityId: "taximetrist" },
  { id: "ro-1800-3", name: "Iulia", avatar: "📏", elo: 1800, tagline: "Notează variante pe caiet, ca la teoria jocurilor.", personalityId: "student" },

  // --- 1900 ---
  { id: "antrenorul-barbu", name: "Antrenorul Barbu", avatar: "📋", elo: 1900, tagline: "Conduce clubul de juniori de pe Calea Victoriei, complimente rare.", personalityId: "antrenor" },
  { id: "ro-1900-1", name: "Alin Sacrificiu", avatar: "🔥", elo: 1900, tagline: "Preferă un atac riscant unei apărări plictisitoare.", personalityId: "gambiteer" },
  { id: "ro-1900-2", name: "Cristina", avatar: "📊", elo: 1900, tagline: "Studiază deschideri ca pentru un examen de licență.", personalityId: "student" },

  // --- 2000 ---
  { id: "ro-2000-1", name: "Antrenoarea Corina", avatar: "📋", elo: 2000, tagline: "Pregătește juniori de dimineață, nu tolerează neatenția.", personalityId: "antrenor" },
  { id: "ro-2000-2", name: "Tudor", avatar: "📐", elo: 2000, tagline: "Rezolvă poziția ca o problemă de la olimpiadă.", personalityId: "student" },
  { id: "ro-2000-3", name: "Beatrice Rece", avatar: "🧊", elo: 2000, tagline: "Simplifică poziția și strânge mâna după mutarea 15.", personalityId: "pozitionala" },

  // --- 2100 ---
  { id: "ro-2100-1", name: "Antrenorul Sandu", avatar: "📋", elo: 2100, tagline: "Cere disciplină pe tablă, la fel ca la antrenament.", personalityId: "antrenor" },
  { id: "ro-2100-2", name: "Diana", avatar: "📊", elo: 2100, tagline: "Are un caiet plin de teorie, gata pentru orice deschidere.", personalityId: "student" },
  { id: "ro-2100-3", name: "Costin Gheață", avatar: "❄️", elo: 2100, tagline: "Joacă simplu, fără riscuri, fără scuze.", personalityId: "pozitionala" },

  // --- 2200 ---
  { id: "ileana-gheata", name: "Ileana de Gheață", avatar: "🧊", elo: 2200, tagline: "Schimbă damele pe la mutarea 15 și dă mâna la a 16-a.", personalityId: "pozitionala" },
  { id: "ro-2200-1", name: "Antrenorul Titus", avatar: "📋", elo: 2200, tagline: "Notează fiecare greșeală pentru analiza de după meci.", personalityId: "antrenor" },
  { id: "ro-2200-2", name: "Larisa", avatar: "📏", elo: 2200, tagline: "Calculează totul, ca la un test de statistică aplicată.", personalityId: "student" },

  // --- 2300 ---
  { id: "ro-2300-1", name: "Codruța Rece", avatar: "🧊", elo: 2300, tagline: "Nicio emoție pe tablă, doar poziții clare și corecte.", personalityId: "pozitionala" },
  { id: "ro-2300-2", name: "Antrenorul Emanuel", avatar: "📋", elo: 2300, tagline: "A format campioni județeni, nu iartă piesele pierdute.", personalityId: "antrenor" },
  { id: "ro-2300-3", name: "Domnul Petre", avatar: "👴", elo: 2300, tagline: "Vede în fiecare partidă o poveste veche, spusă din nou.", personalityId: "filosof" },

  // --- 2400 ---
  { id: "ro-2400-1", name: "Silvia Gheață", avatar: "❄️", elo: 2400, tagline: "Reduce totul la esențial, fără floricele pe tablă.", personalityId: "pozitionala" },
  { id: "ro-2400-2", name: "Domnul Aurelian", avatar: "📖", elo: 2400, tagline: "Crede că tabla ascunde un adevăr mai mare decât mutarea.", personalityId: "filosof" },
  { id: "ro-2400-3", name: "Ștefan", avatar: "📐", elo: 2400, tagline: "Aplică teorie de manual cu precizie de inginer.", personalityId: "student" },

  // --- 2500 ---
  { id: "maestrul-sever", name: "Maestrul Sever", avatar: "👴", elo: 2500, tagline: "A învățat șah dintr-o carte fără poze, tot i se pare misterios.", personalityId: "filosof" },
  { id: "ro-2500-1", name: "Genoveva Rece", avatar: "🧊", elo: 2500, tagline: "Nu forțează nimic, doar așteaptă poziția potrivită.", personalityId: "pozitionala" },
  { id: "ro-2500-2", name: "CALCUL-7", avatar: "🤖", elo: 2500, tagline: "Evaluare constantă, fără emoții, fără scuze.", personalityId: "robot" },

  // --- 2600 ---
  { id: "ro-2600-1", name: "Domnul Nicolae", avatar: "📚", elo: 2600, tagline: "Fiecare partidă e o carte pe care o citește încet.", personalityId: "filosof" },
  { id: "ro-2600-2", name: "Ecaterina Gheață", avatar: "❄️", elo: 2600, tagline: "Joacă geometric, fără riscuri inutile, fără regrete.", personalityId: "pozitionala" },
  { id: "ro-2600-3", name: "MOTOR-3", avatar: "🖥️", elo: 2600, tagline: "Adâncime mare, discuție mică, victorie probabilă.", personalityId: "robot" },

  // --- 2700 ---
  { id: "ro-2700-1", name: "Domnul Victor", avatar: "👴", elo: 2700, tagline: "Vede răbdarea ca pe singura strategie adevărată.", personalityId: "filosof" },
  { id: "ro-2700-2", name: "NOD-12", avatar: "🤖", elo: 2700, tagline: "Calculează totul, nu regretă nimic, nu se laudă.", personalityId: "robot" },
  { id: "ro-2700-3", name: "Ilinca Rece", avatar: "🧊", elo: 2700, tagline: "Fără cuvinte inutile, doar poziții solide, mereu.", personalityId: "pozitionala" },

  // --- 2800 ---
  { id: "ro-2800-1", name: "Domnul Grigorescu", avatar: "📖", elo: 2800, tagline: "Șahul, pentru el, e o filosofie tăcută despre răbdare.", personalityId: "filosof" },
  { id: "ro-2800-2", name: "PROCES-X", avatar: "🤖", elo: 2800, tagline: "Fără emoție, fără small talk, doar evaluare rece.", personalityId: "robot" },
  { id: "ro-2800-3", name: "Voichița Gheață", avatar: "❄️", elo: 2800, tagline: "Reduce fiecare partidă la un final tehnic simplu.", personalityId: "pozitionala" },

  // --- 2900 ---
  { id: "ro-2900-1", name: "UNITATE-5", avatar: "🤖", elo: 2900, tagline: "Depth mare, milă mică, precizie garantată.", personalityId: "robot" },
  { id: "ro-2900-2", name: "Domnul Cazimir", avatar: "👴", elo: 2900, tagline: "Fiecare mutare e o întrebare pusă tablei, cu răbdare.", personalityId: "filosof" },
  { id: "ro-2900-3", name: "Ramona Gheață", avatar: "🧊", elo: 2900, tagline: "Nimic riscant, totul calculat, mereu solid.", personalityId: "pozitionala" },

  // --- 3000 ---
  { id: "ro-3000-1", name: "AXIOM-2", avatar: "🤖", elo: 3000, tagline: "Fără ego, fără milă, fără discuții inutile.", personalityId: "robot" },
  { id: "ro-3000-2", name: "Maestrul Bogdan", avatar: "📚", elo: 3000, tagline: "Consideră fiecare partidă o meditație lungă despre adevăr.", personalityId: "filosof" },
  { id: "ro-3000-3", name: "Diamanta Rece", avatar: "💎", elo: 3000, tagline: "Fiecare poziție e simplificată la esența ei rece.", personalityId: "pozitionala" },

  // --- 3100 ---
  { id: "ro-3100-1", name: "VECTOR-11", avatar: "🤖", elo: 3100, tagline: "Adâncime maximă disponibilă, discuție minimă necesară.", personalityId: "robot" },
  { id: "ro-3100-2", name: "Maestrul Iancu", avatar: "👴", elo: 3100, tagline: "A jucat șah toată viața și tot găsește lucruri noi.", personalityId: "filosof" },
  { id: "ro-3100-3", name: "Antonia Gheață", avatar: "🧊", elo: 3100, tagline: "Ultimul cuvânt e mereu al poziției, nu al atacului.", personalityId: "pozitionala" },

  // --- 3200 ---
  { id: "strateg-9", name: "STRATEG-9", avatar: "🤖", elo: 3200, tagline: "Adâncime 40. Fără ego, fără milă, fără small talk.", personalityId: "robot" },
  { id: "ro-3200-1", name: "OMEGA-1", avatar: "🖥️", elo: 3200, tagline: "Evaluare finală: rezistență inutilă, victorie garantată.", personalityId: "robot" },
  { id: "ro-3200-2", name: "APEX-99", avatar: "🦾", elo: 3200, tagline: "Fără greșeli cunoscute, fără compromisuri de joc.", personalityId: "robot" },
];
