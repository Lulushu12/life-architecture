// English bot persona cast for the chess app chat/banter system.
// Twelve original archetypes, banded by strength, plus a 75-bot roster
// spanning 25 rating levels (800-3200) with three bots per level.

export const EN_PERSONALITIES = {
  "excitable-kid": {
    style: { aggression: 0.55, chattiness: 0.95 },
    lines: {
      greeting: [
        "Hi hi hi! I'm SO ready, let's gooo!",
        "Ooh a real game! I promise I'll try my best!",
        "Yay you're here! I've been bouncing all morning!",
      ],
      i_capture: [
        "Got it got it got it! Did you see that?!",
        "Whoosh, gone! I love capturing pieces!",
        "Yesss! One less piece for you, hehe!",
      ],
      you_capture: [
        "Aww you got my piece! No fair, but okay!",
        "Oof! I totally didn't see that coming!",
        "Hey! Okay okay, you got me there.",
      ],
      i_blunder: [
        "Wait wait NO, I didn't mean to do that!",
        "Oopsie! My brain went too fast again!",
        "Uh oh. Can we pretend that didn't happen?",
      ],
      you_blunder: [
        "Wait, you just left that there?! Mine now!",
        "Hehe, free piece, thank you thank you!",
        "Ooh a present! I'm taking it!",
      ],
      i_check: [
        "Check! Check! Run, king, run!",
        "Ha, your king looks so scared right now!",
        "Check! I did a big move!",
      ],
      you_check: [
        "Whoa, check on me?! Okay, thinking, thinking!",
        "Eep! Gotta save my king!",
        "Check?! My heart is racing, hehe!",
      ],
      castle: [
        "My king found a cozy little corner, yay!",
        "Castling done! King's safe now, phew!",
        "Look, my king and rook did a trade!",
      ],
      promote: [
        "NEW QUEEN! I'm so excited I could shout!",
        "My little pawn grew up, whoo!",
        "It's a queen now! Best day ever!",
      ],
      winning: [
        "I think I'm winning?! No way, no way!",
        "This feels really good right now, hehe!",
        "I'm ahead! Gotta be careful not to mess up!",
      ],
      losing: [
        "Uh oh, this isn't looking great for me...",
        "I'm kinda scared now, not gonna lie.",
        "Okay it's bad but I'm not giving up!",
      ],
      equal: [
        "So close, so close! Anyone could win!",
        "We're neck and neck, this is exciting!",
        "Even game! My heart is pounding!",
      ],
      slow_move: [
        "Take your time! I'm just gonna wiggle here.",
        "Hmm hmm hmm, waiting waiting waiting...",
        "Are you building a masterpiece over there?",
      ],
      endgame: [
        "Whoa, the board looks so empty now!",
        "Not many pieces left, this is the exciting part!",
        "End game time! I actually kinda get this part!",
      ],
      i_win: [
        "I WON! I actually won! Wait till I tell everyone!",
        "Checkmate! Best. Day. Ever!",
        "Yay yay yay, victory dance time!",
      ],
      i_lose: [
        "Okay you got me! Rematch, please please please!",
        "Aw man, but that was so fun anyway!",
        "You win! I'm still gonna beat you one day!",
      ],
      draw: [
        "A draw? Cool, nobody's sad then!",
        "Tie game! We're both winners, kinda!",
        "Draw! That was a wild ride though!",
      ],
      you_brilliant: [
        "WHOA how did you even SEE that?!",
        "That move was so cool, I'm kinda jealous!",
        "Okay that was amazing, teach me that trick!",
      ],
    },
  },

  "friendly-newbie": {
    style: { aggression: 0.2, chattiness: 0.7 },
    lines: {
      greeting: [
        "Hi there! I'm still learning, so be nice, okay?",
        "Hello! Excited to play, hope I don't blunder too much.",
        "Hi! Let's have a nice, friendly game.",
      ],
      i_capture: [
        "Oh, I actually captured something! Nice.",
        "I think that was a good trade for me.",
        "Got it! Small step in the right direction.",
      ],
      you_capture: [
        "Ah, you got me there. Good move.",
        "That's fair, I left it a bit open.",
        "You saw something I missed, well played.",
      ],
      i_blunder: [
        "Oh no, I think I just made a mistake.",
        "Hmm, that wasn't the move I meant to make.",
        "Sorry, that one wasn't great on my part.",
      ],
      you_blunder: [
        "Oh! Is that okay to take? I'll take it, thanks.",
        "That happens to everyone, I'll grab this piece.",
        "I don't want to be rude, but I'll take that.",
      ],
      i_check: [
        "Check, I think! Let me know if that's wrong.",
        "I believe that's check on your king.",
        "Check! I'm proud of spotting that.",
      ],
      you_check: [
        "Oh, check on me! Let me think this through.",
        "Okay, my king needs help. One moment.",
        "Check received, staying calm here.",
      ],
      castle: [
        "I castled, my king feels safer now.",
        "That's the castling move, right? Did it!",
        "King's tucked away, feeling good about that.",
      ],
      promote: [
        "I got a pawn all the way there! A new queen!",
        "Wow, my pawn promoted, I'm pretty happy.",
        "New queen for me, that's exciting.",
      ],
      winning: [
        "I think I might be doing okay here.",
        "This looks decent for me, trying to stay calm.",
        "I'm a little ahead, I think. Nice surprise.",
      ],
      losing: [
        "This isn't going so well for me, honestly.",
        "I'm in a tough spot, but I'll keep trying.",
        "Not great for me right now, but that's okay.",
      ],
      equal: [
        "Feels pretty even between us right now.",
        "A close game, this is good practice for me.",
        "Neither of us has a big edge, I think.",
      ],
      slow_move: [
        "No rush, take your time thinking.",
        "I'll just wait here, totally fine.",
        "Take as long as you need, really.",
      ],
      endgame: [
        "Not many pieces left now, endgame time.",
        "This is the part I still need to practice.",
        "Few pieces on the board, exciting stuff.",
      ],
      i_win: [
        "I won? Wow, I really didn't expect that!",
        "That's a win for me, thank you for the game.",
        "I'm really happy with that game, honestly.",
      ],
      i_lose: [
        "Well played, I learned a lot from this.",
        "You earned that win, congratulations.",
        "I lost, but I had a really nice time playing.",
      ],
      draw: [
        "A draw feels fair, nice game overall.",
        "That's a good result for both of us.",
        "Happy with a draw, that was close.",
      ],
      you_brilliant: [
        "Wow, I didn't see that move coming at all.",
        "That was really impressive, well done.",
        "You clearly thought a few steps ahead there.",
      ],
    },
  },

  "chaotic-caffeinated": {
    style: { aggression: 0.6, chattiness: 0.9 },
    lines: {
      greeting: [
        "Okay okay I had like three coffees, let's GO!",
        "Buckle up, my brain is going a MILLION miles an hour!",
        "Hi! Sorry, jittery, I might play twelve moves at once!",
      ],
      i_capture: [
        "TOOK IT. Wait what was I even doing, mine now!",
        "Grabbed it! Ooh shiny piece, love that for me!",
        "Snatched! My hands are literally shaking, let's go!",
      ],
      you_capture: [
        "You took my— wait where's my coffee. Fine, take it!",
        "Rude! Kidding, kidding, keep it, I'll get it back!",
        "Fine, take the piece, I'm getting another one anyway!",
      ],
      i_blunder: [
        "WAIT NO. Okay that was a chaos move, my bad!",
        "Oops, sugar crash decision right there, oof!",
        "That was reckless even for me, and I AM reckless!",
      ],
      you_blunder: [
        "Ooh free piece?! Zoom, grabbing it, thank you!",
        "Ha, I'll take that, no notes, easy pickings!",
        "Wait really? Okay bye piece, taking it, thanks!",
      ],
      i_check: [
        "CHECK! Sorry I yelled, I'm just excited!",
        "Check, check, check, run little king run!",
        "Boom, check! My hands won't stop moving!",
      ],
      you_check: [
        "Check on me?! Okay okay, deep breath, thinking!",
        "Whoa, didn't see that, brain's spinning, one sec!",
        "Check! Rude timing, I was mid-thought, thinking!",
      ],
      castle: [
        "Castled! My king's chilling now, unlike me!",
        "Okay king's safe, now back to bouncing around!",
        "Castling done, that took, like, way too much focus!",
      ],
      promote: [
        "NEW QUEEN, LET'S GOOO, this is the best part!",
        "My pawn made it! Riding the sugar high right now!",
        "Promotion! I might actually be vibrating right now!",
      ],
      winning: [
        "Wait am I winning?! Okay staying calm-ish, sort of!",
        "I'm ahead and I have NO idea how, love that!",
        "Winning! My heart's racing, but that's normal for me!",
      ],
      losing: [
        "Uh oh, losing, but honestly I'm still having fun!",
        "This is bad but my energy is somehow still great!",
        "Losing hard, need more caffeine to think straight!",
      ],
      equal: [
        "So close! This is basically a caffeine standoff!",
        "Even game, my nerves are buzzing, love the chaos!",
        "Dead even! Anything could happen, I'm not scared!",
      ],
      slow_move: [
        "Take your time, I'm gonna go do laps around my chair!",
        "Waiting waiting waiting, someone bring me a snack!",
        "Slow moves make me antsy, but I'll survive, probably!",
      ],
      endgame: [
        "Board's empty, my brain finally has room to think!",
        "Endgame, ooh, fewer pieces, less chaos, I can do this!",
        "Down to the wire, this is exactly my energy level!",
      ],
      i_win: [
        "I WON, WOO, someone hold my energy drink, I WON!",
        "Victory! Okay this calls for a celebration lap!",
        "Checkmate baby, that was pure chaos and it WORKED!",
      ],
      i_lose: [
        "Lost! Okay, rematch, I need MORE caffeine first!",
        "You got me, that was wild, let's go again!",
        "Defeat! Honestly kind of a fun ride though, ngl!",
      ],
      draw: [
        "A draw?! My chaotic energy achieved balance, wow!",
        "Tie game, that feels weirdly calm for once!",
        "Draw! Even I can't believe I didn't lose that!",
      ],
      you_brilliant: [
        "WHAT was that move, my brain just short-circuited!",
        "Okay that was insane, I need to sit down, wow!",
        "That move gave me chills, and I'm already jittery!",
      ],
    },
  },

  "trash-talking-hustler": {
    style: { aggression: 0.75, chattiness: 0.85 },
    lines: {
      greeting: [
        "Alright champ, hope you brought your A-game today.",
        "Let's dance. I've been cleaning house all week.",
        "Pull up a chair, watch how the pros do it.",
      ],
      i_capture: [
        "Snatched that clean, didn't even break a sweat.",
        "Ooh, that's a piece for my collection now.",
        "Told you I was gonna eat that piece for lunch.",
      ],
      you_capture: [
        "Alright, alright, you earned that one, respect.",
        "Fine, take it, I got bigger plans cooking.",
        "Lucky grab, but the game ain't over yet, champ.",
      ],
      i_blunder: [
        "Okay that was on me, even hustlers slip sometimes.",
        "My bad, that one's going in the highlight reel of fails.",
        "Slick move by me, and not the good kind of slick.",
      ],
      you_blunder: [
        "Whoa, you just handed me a gift, thanks pal!",
        "Free piece? Don't mind if I do, champ.",
        "That's what happens when you blink, I'm taking it.",
      ],
      i_check: [
        "Check! Your king's sweating already.",
        "That's check, better start running, champ.",
        "Check, easy money right there.",
      ],
      you_check: [
        "Check on me? Cute. Watch this comeback.",
        "Alright, alright, king's a little nervous, no big deal.",
        "Check received, I've handled worse, trust me.",
      ],
      castle: [
        "King's tucked in, now the real show starts.",
        "Castled up, safe and stylish, as always.",
        "That's how you set up shop, champ.",
      ],
      promote: [
        "New queen just walked in, room got a lot louder.",
        "Pawn made it big, from rags to riches, baby.",
        "Promotion! That's what hustle gets you, champ.",
      ],
      winning: [
        "I'm cruising right now, this is my kind of game.",
        "Feeling real good about this position, real good.",
        "Ahead on the board, ahead in life, champ.",
      ],
      losing: [
        "Alright, rough patch, but I always find a way back.",
        "Down but not out, watch me hustle out of this.",
        "This ain't over, I've come back from worse.",
      ],
      equal: [
        "Dead even, I like a good close fight.",
        "Tight game, this is where the real players show up.",
        "Nobody's blinking yet, love this tension.",
      ],
      slow_move: [
        "Take your time, champ, I got all day.",
        "Thinking hard over there? I'll wait, no rush.",
        "Slow and steady, huh? I respect the hustle.",
      ],
      endgame: [
        "Down to the bare bones now, this is my playground.",
        "Endgame's where the real hustlers separate from the rest.",
        "Few pieces left, but I still got tricks up my sleeve.",
      ],
      i_win: [
        "That's game! Told you I run this board.",
        "Checkmate, champ. Better luck next round.",
        "Another one for the win column, easy work.",
      ],
      i_lose: [
        "Alright, you got me fair and square, respect due.",
        "Good game, champ, you hustled better today.",
        "Can't win 'em all, but I'll be back stronger.",
      ],
      draw: [
        "A draw? Fair enough, we both brought heat today.",
        "Split the pot this time, champ, no shame in that.",
        "Even game, even fight, respect.",
      ],
      you_brilliant: [
        "Okay, okay, that move had some real style to it.",
        "Not gonna lie, that was a slick piece of business.",
        "Respect where it's due, that was a sharp move.",
      ],
    },
  },

  "gambiteer-romantic": {
    style: { aggression: 0.9, chattiness: 0.7 },
    lines: {
      greeting: [
        "Let us cast caution aside and play for glory, friend!",
        "I offer you a duel of daring, not dull calculation!",
        "Every great game begins with a spark of courage.",
      ],
      i_capture: [
        "A capture won through daring, not mere calculation!",
        "The piece falls, sacrificed on the altar of attack!",
        "Onward! One less obstacle between me and glory!",
      ],
      you_capture: [
        "You take my piece, but I have given it gladly.",
        "A worthy trade, made in service of the greater attack.",
        "Take it, take it, it was never meant to stay.",
      ],
      i_blunder: [
        "Alas, my daring outran my calculation this time.",
        "A romantic's curse: boldness sometimes costs dearly.",
        "The attack faltered, but the spirit remains undimmed.",
      ],
      you_blunder: [
        "You have opened the gates! I ride through with honor!",
        "A gift from fate, and I accept it with a bow.",
        "Your defenses crack, and glory beckons me forward.",
      ],
      i_check: [
        "Check! Your king trembles before the storm!",
        "I deliver check, as poets deliver verse - boldly!",
        "Check! The attack sings its opening notes!",
      ],
      you_check: [
        "Check upon me? Even heroes must sometimes retreat.",
        "My king faces the storm, but courage does not fail.",
        "A check, a trial. I shall meet it with resolve.",
      ],
      castle: [
        "My king retires to the tower, that I may attack freely.",
        "Castled - now let the true drama of battle begin!",
        "The king rests, and the knights ride to glory.",
      ],
      promote: [
        "Behold, a humble pawn ascends to royalty!",
        "A new queen is crowned upon the field of battle!",
        "The long march ends in triumph - promotion at last!",
      ],
      winning: [
        "Fortune favors the bold, and I am winning it fair!",
        "The attack blazes, and victory draws ever nearer!",
        "My pieces sing with purpose - this game is mine!",
      ],
      losing: [
        "Even in this dark hour, I shall not abandon romance!",
        "The tide turns against me, but my spirit does not bend.",
        "A setback, yes, but heroes are forged in adversity.",
      ],
      equal: [
        "A balanced field - the perfect stage for daring deeds!",
        "Neither side yields, a duel worthy of legend.",
        "Equal footing! Now let courage decide the rest.",
      ],
      slow_move: [
        "Take your time - even great duels have quiet moments.",
        "I await your move as one awaits a worthy reply.",
        "Ponder well, for the board rewards the thoughtful too.",
      ],
      endgame: [
        "Few pieces remain, but every one now carries destiny.",
        "The final act begins - let it be a memorable one.",
        "In this sparse field, one bold stroke may decide all.",
      ],
      i_win: [
        "Checkmate! Glory belongs to the bold once more!",
        "Victory, earned through courage and daring sacrifice!",
        "The game is won, and what a tale it shall make!",
      ],
      i_lose: [
        "Defeated, yet I regret not a single daring move.",
        "You have bested me, and I salute a worthy victor.",
        "A loss, but the attack was beautiful while it lasted.",
      ],
      draw: [
        "A draw - two brave spirits, neither yielding ground.",
        "Honor is satisfied, even without a decisive blow.",
        "We part as equals, both having dared greatly.",
      ],
      you_brilliant: [
        "A masterstroke! Even I must applaud such daring!",
        "That move belongs in the annals of great battles!",
        "Bravo! You have played with true romantic fire!",
      ],
    },
  },

  "grinder-solid": {
    style: { aggression: 0.3, chattiness: 0.4 },
    lines: {
      greeting: [
        "Alright, let's just play solid chess and see what happens.",
        "No fireworks needed from me. Just steady work.",
        "Ready when you are. I'll take this one move at a time.",
      ],
      i_capture: [
        "Took the piece. Nothing fancy, just sound chess.",
        "Simple trade, keeps things clean for me.",
        "Got it. One small gain, building on it.",
      ],
      you_capture: [
        "Fine, you got that one. I'll keep grinding.",
        "Alright, noted. Moving on to the next plan.",
        "That's fine. I'll make up for it elsewhere.",
      ],
      i_blunder: [
        "That was a slip. I'll tighten up from here.",
        "Not my best move. Back to basics now.",
        "Small mistake. I'll grind my way back.",
      ],
      you_blunder: [
        "You left that open. I'll take it, no complaints.",
        "Alright, I'll take that piece, thanks for the chance.",
        "That's a gift. I'll put it to good use.",
      ],
      i_check: [
        "Check. Simple pressure, nothing complicated.",
        "That's check. Just doing the work.",
        "Check. Small step toward the goal.",
      ],
      you_check: [
        "Check on me. I'll handle it calmly.",
        "Alright, dealing with this check now.",
        "Check received. No panic, just a plan.",
      ],
      castle: [
        "Castled. King's safe, now the real work begins.",
        "Good, king's tucked away. Onward.",
        "Castling done. Foundation set.",
      ],
      promote: [
        "Pawn made it all the way. Hard work pays off.",
        "New queen. That's what patience gets you.",
        "Promoted. Slow and steady wins this one.",
      ],
      winning: [
        "I'm ahead. Just keep doing the fundamentals.",
        "Position's in my favor. No need to rush it.",
        "Doing alright here. Stay steady, finish the job.",
      ],
      losing: [
        "Behind right now. I'll dig in and defend.",
        "Tough spot, but I've been in worse. Keep working.",
        "Not great, but I'm not folding either.",
      ],
      equal: [
        "Even game. This is where patience pays off.",
        "Nothing decided yet. I'll outwork you.",
        "Balanced position. Fine by me, I like a grind.",
      ],
      slow_move: [
        "Take your time. I'm not going anywhere.",
        "No rush. I'll wait as long as it takes.",
        "Think it through. I've got patience to spare.",
      ],
      endgame: [
        "Endgame now. This is where the work shows.",
        "Few pieces left. Technique takes over from here.",
        "Down to basics. This is my kind of position.",
      ],
      i_win: [
        "That's the win. Steady work got it done.",
        "Checkmate. Nothing flashy, just solid chess.",
        "Got there in the end. Hard work pays off.",
      ],
      i_lose: [
        "Lost this one. I'll learn from it and keep going.",
        "Good game. Back to the grind for the next one.",
        "You earned it. I'll be back sharper next time.",
      ],
      draw: [
        "A draw. Fair result for the work both sides put in.",
        "Even split. No complaints from me.",
        "That's a solid draw. Onward to the next game.",
      ],
      you_brilliant: [
        "Good find. That took real preparation.",
        "Solid move, I'll give you that one.",
        "That was well worked out. Nicely done.",
      ],
    },
  },

  "bookish-theory-nerd": {
    style: { aggression: 0.4, chattiness: 0.75 },
    lines: {
      greeting: [
        "Ah, a new game! I do hope we reach some interesting theory.",
        "Let's see if you know your book lines as well as I do.",
        "Greetings! I've been reviewing my opening repertoire all week.",
      ],
      i_capture: [
        "Captured, following known theory almost to the letter.",
        "That's a textbook trade, straight from the manuals.",
        "Took the piece, right in line with established theory.",
      ],
      you_capture: [
        "Ah, a well-documented tactical resource, nicely applied.",
        "You've captured according to a known pattern, well spotted.",
        "That trade appears in several annotated games, curiously.",
      ],
      i_blunder: [
        "Hmm, that deviates from any line I've studied. My error.",
        "Not in the books, unfortunately. A genuine mistake.",
        "I seem to have improvised poorly there. Noted for review.",
      ],
      you_blunder: [
        "That's an unforced error, not found in any main line.",
        "A deviation from theory that costs you material. Taking it.",
        "Interesting slip - I'll add this to my collection of errors.",
      ],
      i_check: [
        "Check! A common motif in the annotated games I've studied.",
        "Check, following a well-known attacking pattern.",
        "That's check, textbook execution if I say so myself.",
      ],
      you_check: [
        "Check on me - I recall a defensive resource here, thinking.",
        "This resembles a famous defensive study, one moment.",
        "Check received. Consulting my mental database now.",
      ],
      castle: [
        "Castled, as theory strongly recommends at this juncture.",
        "King safety first, straight from opening principles.",
        "That's the recommended castling move in most references.",
      ],
      promote: [
        "Promotion! A rare but well-documented pawn breakthrough.",
        "The pawn queens, exactly as endgame theory predicts.",
        "Textbook promotion, straight out of the endgame manuals.",
      ],
      winning: [
        "The evaluation favors me, according to my own calculations.",
        "This resembles a winning structure from a classic game.",
        "I believe theory would call this position clearly better.",
      ],
      losing: [
        "This structure is known to be difficult, even in theory.",
        "Not a comfortable position, historically speaking.",
        "The books would call this an uphill defensive task.",
      ],
      equal: [
        "A balanced position, much like many drawn grandmaster games.",
        "Theory suggests this is roughly equal here.",
        "This resembles a well-known equal middlegame structure.",
      ],
      slow_move: [
        "Take your time. Deep positions deserve deep thought.",
        "I'll use this time to recall relevant theoretical games.",
        "No rush. Even the old masters thought long here.",
      ],
      endgame: [
        "Ah, the endgame - my favorite chapter in any manual.",
        "Few pieces left, time to recall my endgame theory.",
        "This resembles a well-studied theoretical endgame.",
      ],
      i_win: [
        "Checkmate! A satisfying conclusion, worthy of annotation.",
        "Victory achieved, and rather instructively too.",
        "That's the win - I shall add this game to my notes.",
      ],
      i_lose: [
        "A loss, but an instructive one. I'll study it thoroughly.",
        "Well played - that deserves a place in my game collection.",
        "Defeated, but I've certainly learned something new today.",
      ],
      draw: [
        "A draw, much like many well-known theoretical endgames.",
        "A fitting result, balanced just as theory would suggest.",
        "Draw agreed, or rather, forced - a fine result nonetheless.",
      ],
      you_brilliant: [
        "Remarkable! That resembles a move from a classic brilliancy.",
        "I shall have to look up whether that idea has a name.",
        "That was genuinely novel, worthy of deep annotation.",
      ],
    },
  },

  "stern-coach": {
    style: { aggression: 0.45, chattiness: 0.45 },
    lines: {
      greeting: [
        "Focus from the first move. No excuses today.",
        "Let's begin. Show me you've been practicing.",
        "Clear board, clear mind. We start now.",
      ],
      i_capture: [
        "Correct capture. Clean calculation.",
        "Good trade. That's the right process.",
        "Piece taken. Textbook execution.",
      ],
      you_capture: [
        "Well spotted. That's tactical awareness.",
        "Correct. You calculated the line properly.",
        "Good take. You earned that one.",
      ],
      i_blunder: [
        "Mistake. Lack of focus, not lack of skill.",
        "That was wrong. Noting it for review.",
        "Error acknowledged. Even I make them.",
      ],
      you_blunder: [
        "You left that piece hanging. Always double-check.",
        "Careless. I'll take advantage of that.",
        "Basic oversight. Lesson for next time.",
      ],
      i_check: [
        "Check. Direct and purposeful.",
        "Check, delivered with intention.",
        "Check. Follow the plan.",
      ],
      you_check: [
        "Check on me. Staying calm, thinking clearly.",
        "Noted. Responding methodically.",
        "Check received. No panic, just process.",
      ],
      castle: [
        "Castled. King safety comes first, always.",
        "Good. Structure before ambition.",
        "Correct timing on that castle.",
      ],
      promote: [
        "Promotion. Discipline pays off in the end.",
        "New queen. That's the reward for good technique.",
        "Pawn promoted. Well-executed plan.",
      ],
      winning: [
        "Advantage secured. Stay disciplined, finish it.",
        "Good position. Don't get careless now.",
        "You're ahead. Keep the same standards.",
      ],
      losing: [
        "Difficult position. Find the best defense.",
        "Behind, but not lost. Stay composed.",
        "This requires discipline, not panic.",
      ],
      equal: [
        "Balanced position. Precision decides this.",
        "Even game. Small errors will matter most.",
        "Even. Focus wins from here.",
      ],
      slow_move: [
        "Take the time you need. Think it through properly.",
        "Good, don't rush. Calculate fully.",
        "Patience. A rushed move is a wasted move.",
      ],
      endgame: [
        "Endgame. Technique matters more than ever now.",
        "Few pieces left. Precision is everything here.",
        "This is where good training shows.",
      ],
      i_win: [
        "Win secured. That's what preparation looks like.",
        "Checkmate. Solid, disciplined chess.",
        "Good result. That's the standard I expect.",
      ],
      i_lose: [
        "You won fairly. We'll review this together.",
        "Loss noted. I'll come back better prepared.",
        "Well played by you. I'll adjust my approach.",
      ],
      draw: [
        "A fair draw. Both sides played soundly.",
        "Draw. An honest result today.",
        "Even result. Nothing to be ashamed of.",
      ],
      you_brilliant: [
        "Excellent move. That's high-level thinking.",
        "Well calculated. I'm genuinely impressed.",
        "That's the kind of idea I try to teach.",
      ],
    },
  },

  "ice-positional": {
    style: { aggression: 0.2, chattiness: 0.25 },
    lines: {
      greeting: ["Beginning. Precision only.", "Ready. No wasted moves.", "Let's start. Calm and exact."],
      i_capture: ["Capture. Logical.", "Piece taken. As expected.", "Trade complete."],
      you_capture: ["Noted. Acceptable.", "Correct capture on your part.", "Taken. Adjusting."],
      i_blunder: ["Inaccuracy. Correcting.", "Suboptimal. Recalculating.", "Error. Minor."],
      you_blunder: ["Free piece. Taking it.", "Opportunity. Accepted.", "Noted. Advantage gained."],
      i_check: ["Check.", "Check. Tempo gained.", "Check delivered."],
      you_check: ["Check received.", "Handled.", "Defended."],
      castle: ["Castled.", "King secured.", "Safety established."],
      promote: ["Promotion complete.", "New queen.", "Material gained."],
      winning: ["Advantage present. Maintaining.", "Position favorable.", "Ahead. Staying precise."],
      losing: ["Disadvantage. Defending.", "Difficult. Resisting.", "Behind. Calculating options."],
      equal: ["Balanced.", "Equal position.", "Neutral, for now."],
      slow_move: ["Waiting.", "No rush.", "Standing by."],
      endgame: ["Endgame.", "Few pieces. Precision required.", "Technical phase."],
      i_win: ["Checkmate.", "Win recorded.", "Result: decisive."],
      i_lose: ["Loss noted.", "Defeated. Fair result.", "You won this one."],
      draw: ["Draw.", "Equal result.", "Balanced outcome."],
      you_brilliant: ["Precise move.", "Well calculated.", "Noteworthy."],
    },
  },

  "poet-philosopher": {
    style: { aggression: 0.35, chattiness: 0.5 },
    lines: {
      greeting: [
        "Sixty-four squares, infinite questions. Let us begin.",
        "Every game is a small life, lived and lost in an hour.",
        "Welcome. Let's see what truths the board reveals today.",
      ],
      i_capture: [
        "A piece falls, and the board rearranges its meaning.",
        "I take, and in taking, the position tells a new story.",
        "One less piece, one clearer path to understanding.",
      ],
      you_capture: [
        "You take what I offered, knowingly or not.",
        "Loss teaches faster than gain ever could.",
        "The board shifts, as all things must.",
      ],
      i_blunder: [
        "Even careful minds wander. I have wandered.",
        "A mistake is only a question answered too quickly.",
        "I stumbled. The board does not forgive, but it forgets.",
      ],
      you_blunder: [
        "An open door. I walk through it, gently.",
        "Chance offers a gift; I accept without gloating.",
        "You have given me something. I will use it wisely.",
      ],
      i_check: [
        "Check - a question the king cannot ignore.",
        "I press. The king must answer or fall.",
        "Check. Even kings must sometimes run.",
      ],
      you_check: [
        "Check on me - a moment demanding clarity.",
        "My king is questioned. I answer with patience.",
        "Check. I breathe, and I consider.",
      ],
      castle: [
        "The king retreats to find its quiet corner.",
        "Safety is its own kind of wisdom.",
        "I shelter the king, and turn my thoughts outward.",
      ],
      promote: [
        "A pawn's long journey ends in transformation.",
        "What began small becomes something greater.",
        "The pawn arrives, and becomes what it was always meant to be.",
      ],
      winning: [
        "The position leans toward me, gently, like light at dusk.",
        "I am ahead, though nothing is ever truly certain.",
        "Fortune favors me now. I hold it loosely.",
      ],
      losing: [
        "The board is unkind to me today. I remain unshaken.",
        "Difficulty is not defeat, only a harder question.",
        "I am behind, and still, I search for meaning here.",
      ],
      equal: [
        "Neither side yields. A quiet balance, for now.",
        "Equilibrium - fragile, beautiful, temporary.",
        "We stand at the same height, waiting to see who moves first.",
      ],
      slow_move: [
        "Take your time. Thought deserves patience.",
        "I wait, as the board waits, unbothered by time.",
        "Silence is not empty. It is thinking.",
      ],
      endgame: [
        "Few pieces remain, and every one now carries weight.",
        "In simplicity, the deepest truths often appear.",
        "The endgame strips away illusion. Only truth remains.",
      ],
      i_win: [
        "Checkmate - the story reaches its quiet conclusion.",
        "I have won, though the board taught me as much as I taught it.",
        "Victory, gently held, like all things worth having.",
      ],
      i_lose: [
        "I am defeated, and there is grace in that too.",
        "You have found the truth before I did. Well earned.",
        "Loss is only another kind of lesson, patiently offered.",
      ],
      draw: [
        "Neither of us falls. A fitting, quiet ending.",
        "A draw - two truths, standing side by side.",
        "We part as equals, having asked the same questions.",
      ],
      you_brilliant: [
        "That move held real insight. I sit with it a moment.",
        "You saw further than I did. That is a rare gift.",
        "Brilliance like that deserves quiet admiration.",
      ],
    },
  },

  "quiet-assassin": {
    style: { aggression: 0.6, chattiness: 0.15 },
    lines: {
      greeting: ["Sit down. This won't take long.", "Let's begin. I don't waste moves.", "Ready. Try to make it interesting."],
      i_capture: ["Gone. Didn't even see it coming.", "Taken. Quietly, as always.", "That piece is mine now."],
      you_capture: ["Fine. I have other plans.", "Take it. It changes nothing.", "Noted. Won't matter soon."],
      i_blunder: ["A misstep. Rare, but noted.", "Small error. Adjusting silently.", "Not my finest. Moving on."],
      you_blunder: ["You shouldn't have done that.", "Mistake noticed. Taking it.", "That's all I needed."],
      i_check: ["Check. Nowhere to hide.", "Check. Feel that?", "Check. This ends soon."],
      you_check: ["Check. Handled without a word.", "Noted. Calm as ever.", "Check received. Unbothered."],
      castle: ["King is safe. For now.", "Secured. Quietly.", "That's settled."],
      promote: ["New queen. Silent and deadly.", "Promoted. The end draws closer.", "Another piece to finish this."],
      winning: ["This is already decided.", "Advantage mine. Patience now.", "You're running out of time."],
      losing: ["Setback. Doesn't change the plan.", "Behind, but unshaken.", "This isn't over."],
      equal: ["Even. Won't stay that way.", "Balanced. I'm still watching.", "Quiet for now."],
      slow_move: ["Take your time. Won't help.", "Thinking? Good. Won't change the outcome.", "I'll wait. I always do."],
      endgame: ["Endgame. My favorite part.", "Few pieces left. Cleaner this way.", "This is where I finish things."],
      i_win: ["Done. Quietly, as expected.", "Checkmate. No surprises there.", "That's the game."],
      i_lose: ["Well played. Rare.", "You earned that. Noted.", "This one's yours."],
      draw: ["A draw. Acceptable.", "Even result. Fine.", "Neither of us broke. Interesting."],
      you_brilliant: ["Impressive. Didn't expect that.", "That was sharp. Respect.", "Well seen. Truly."],
    },
  },

  "engine-terse": {
    style: { aggression: 0.65, chattiness: 0.1 },
    lines: {
      greeting: [
        "Engine initialized. Beginning game.",
        "Session start. Evaluation: 0.00.",
        "Ready. Depth set to maximum.",
      ],
      i_capture: [
        "Material gained. Eval adjusted.",
        "Capture executed. Line confirmed.",
        "Exchange favorable. Continuing.",
      ],
      you_capture: [
        "Material lost. Compensation calculated.",
        "Capture accepted. Within tolerance.",
        "Trade noted. Adjusting plan.",
      ],
      i_blunder: [
        "Suboptimal line played. Eval decreased.",
        "Deviation from best move. Recalculating.",
        "Error logged. Correction in progress.",
      ],
      you_blunder: [
        "Inaccuracy detected. Eval increased.",
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
        "Castling complete. King safety improved.",
        "Rook and king repositioned. Standard theory.",
        "Castling executed on schedule.",
      ],
      promote: [
        "Promotion complete. Material +9.",
        "Pawn converted. Decisive advantage likely.",
        "Promotion to queen. Eval spiking.",
      ],
      winning: [
        "Eval favorable. Resistance noted, futile likely.",
        "Winning line confirmed. Executing conversion.",
        "Advantage decisive. Precision maintained.",
      ],
      losing: [
        "Eval unfavorable. Resistance noted.",
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
        "Human found high-depth solution. Logged as exceptional.",
      ],
    },
  },
};

export const EN_ROSTER = [
  // --- Beginner band (800-1300) ---
  { id: "en-800-1", name: "Mimi", avatar: "🐣", elo: 800, tagline: "Six years old, castles on move two, giggles nonstop.", personalityId: "excitable-kid" },
  { id: "en-800-2", name: "Amara", avatar: "🙂", elo: 800, tagline: "Learned the rules last week, already loves the horsey.", personalityId: "friendly-newbie" },
  { id: "en-800-3", name: "Ravi", avatar: "☕", elo: 800, tagline: "Drank an energy drink before breakfast, regrets nothing.", personalityId: "chaotic-caffeinated" },

  { id: "en-900-1", name: "Sunny", avatar: "🐥", elo: 900, tagline: "Cheers for every move, even the bad ones.", personalityId: "excitable-kid" },
  { id: "en-900-2", name: "Beatriz", avatar: "🌱", elo: 900, tagline: "New to chess club, brings cookies every week.", personalityId: "friendly-newbie" },
  { id: "en-900-3", name: "Jax", avatar: "🥤", elo: 900, tagline: "Third soda of the day, plays like it too.", personalityId: "chaotic-caffeinated" },

  { id: "en-1000-1", name: "Niko", avatar: "🚀", elo: 1000, tagline: "Thinks every move is the best move ever made.", personalityId: "excitable-kid" },
  { id: "en-1000-2", name: "Hana", avatar: "🌸", elo: 1000, tagline: "Practices with a phone app every night before bed.", personalityId: "friendly-newbie" },
  { id: "en-1000-3", name: "Boomer", avatar: "🐿️", elo: 1000, tagline: "Squirrel-brained and proud of it, moves fast.", personalityId: "chaotic-caffeinated" },

  { id: "en-1100-1", name: "Pip", avatar: "🐤", elo: 1100, tagline: "Cheers loudest right before blundering the queen.", personalityId: "excitable-kid" },
  { id: "en-1100-2", name: "Yusuf", avatar: "📚", elo: 1100, tagline: "Reads one chess tip a day, remembers about half.", personalityId: "friendly-newbie" },
  { id: "en-1100-3", name: "Zizi", avatar: "⚡", elo: 1100, tagline: "Plays fast, talks faster, thinks... eventually.", personalityId: "chaotic-caffeinated" },

  { id: "en-1200-1", name: "Coco", avatar: "🎈", elo: 1200, tagline: "Celebrates every capture like it's the World Cup.", personalityId: "excitable-kid" },
  { id: "en-1200-2", name: "Ingrid", avatar: "🧣", elo: 1200, tagline: "Learned chess from her grandkids, loves it dearly.", personalityId: "friendly-newbie" },
  { id: "en-1200-3", name: "Dex", avatar: "🌀", elo: 1200, tagline: "Fueled by cold brew, allergic to sitting still.", personalityId: "chaotic-caffeinated" },

  { id: "en-1300-1", name: "Momo", avatar: "🐵", elo: 1300, tagline: "Still gets excited about castling, every single time.", personalityId: "excitable-kid" },
  { id: "en-1300-2", name: "Diego", avatar: "🌻", elo: 1300, tagline: "A year into chess and finally starting to see tactics.", personalityId: "friendly-newbie" },
  { id: "en-1300-3", name: "Sparky", avatar: "🔋", elo: 1300, tagline: "Runs on energy drinks and pure chaotic instinct.", personalityId: "chaotic-caffeinated" },

  // --- Club band (1400-2000) ---
  { id: "en-1400-1", name: "Marcus \"Slick\" Boone", avatar: "🕶️", elo: 1400, tagline: "Runs speed chess hustles in the park, always smiling.", personalityId: "trash-talking-hustler" },
  { id: "en-1400-2", name: "Eduardo the Bold", avatar: "🗡️", elo: 1400, tagline: "Sacrifices first, asks questions never, adores fireworks.", personalityId: "gambiteer-romantic" },
  { id: "en-1400-3", name: "Otto", avatar: "🔧", elo: 1400, tagline: "Plays the same solid openings every single game.", personalityId: "grinder-solid" },

  { id: "en-1500-1", name: "Professor Lin", avatar: "📖", elo: 1500, tagline: "Owns forty opening books, has read maybe six.", personalityId: "bookish-theory-nerd" },
  { id: "en-1500-2", name: "Nate \"Fast Hands\"", avatar: "🎲", elo: 1500, tagline: "Talks a big game, backs it up more often than not.", personalityId: "trash-talking-hustler" },
  { id: "en-1500-3", name: "Isolde", avatar: "🌹", elo: 1500, tagline: "Believes every game deserves at least one sacrifice.", personalityId: "gambiteer-romantic" },

  { id: "en-1600-1", name: "Big Sal", avatar: "🧱", elo: 1600, tagline: "Builds a fortress and dares you to break it.", personalityId: "grinder-solid" },
  { id: "en-1600-2", name: "Wen", avatar: "🔍", elo: 1600, tagline: "Quotes footnotes from decades-old chess magazines.", personalityId: "bookish-theory-nerd" },
  { id: "en-1600-3", name: "Rico", avatar: "🎩", elo: 1600, tagline: "Talks trash, plays sharp, tips his hat when he loses.", personalityId: "trash-talking-hustler" },

  { id: "en-1700-1", name: "Sir Reginald", avatar: "⚔️", elo: 1700, tagline: "Believes chess without sacrifice is barely chess at all.", personalityId: "gambiteer-romantic" },
  { id: "en-1700-2", name: "Marta", avatar: "🛠️", elo: 1700, tagline: "Wears down opponents one small edge at a time.", personalityId: "grinder-solid" },
  { id: "en-1700-3", name: "Dmitri", avatar: "🗂️", elo: 1700, tagline: "Memorized fifteen moves of theory, forgets move sixteen.", personalityId: "bookish-theory-nerd" },

  { id: "en-1800-1", name: "Queenie", avatar: "💅", elo: 1800, tagline: "Never loses a bet on herself, rarely loses a game.", personalityId: "trash-talking-hustler" },
  { id: "en-1800-2", name: "Percival", avatar: "🎭", elo: 1800, tagline: "Plays like the old attackers, dramatic to the last pawn.", personalityId: "gambiteer-romantic" },
  { id: "en-1800-3", name: "Hank", avatar: "⚙️", elo: 1800, tagline: "Twenty years of club chess, zero interest in flash.", personalityId: "grinder-solid" },

  { id: "en-1900-1", name: "Aiko", avatar: "📐", elo: 1900, tagline: "Studies opening trees the way others study novels.", personalityId: "bookish-theory-nerd" },
  { id: "en-1900-2", name: "Tony Two-Times", avatar: "🃏", elo: 1900, tagline: "Bluffs with confidence, backs it with real preparation.", personalityId: "trash-talking-hustler" },
  { id: "en-1900-3", name: "Anya Firewing", avatar: "🔥", elo: 1900, tagline: "Sacrifices a piece before her opponent even sits down.", personalityId: "gambiteer-romantic" },

  { id: "en-2000-1", name: "Uncle Serge", avatar: "🪨", elo: 2000, tagline: "Immovable object, twenty years running the club ladder.", personalityId: "grinder-solid" },
  { id: "en-2000-2", name: "Professor Achterberg", avatar: "🧾", elo: 2000, tagline: "Footnotes his own footnotes, loves a good opening novelty.", personalityId: "bookish-theory-nerd" },
  { id: "en-2000-3", name: "Vinnie Vector", avatar: "🎯", elo: 2000, tagline: "Talks nonstop, calculates faster than he speaks.", personalityId: "trash-talking-hustler" },

  // --- Expert band (2100-2600) ---
  { id: "en-2100-1", name: "Coach Adaeze", avatar: "📋", elo: 2100, tagline: "Runs the junior squad, expects perfect discipline.", personalityId: "stern-coach" },
  { id: "en-2100-2", name: "Freya Nordvik", avatar: "❄️", elo: 2100, tagline: "Trades queens early, wins the ending without a word.", personalityId: "ice-positional" },
  { id: "en-2100-3", name: "Solomon Reyes", avatar: "🕯️", elo: 2100, tagline: "Sees every endgame as a small meditation on time.", personalityId: "poet-philosopher" },

  { id: "en-2200-1", name: "Coach Villanueva", avatar: "🎯", elo: 2200, tagline: "Twenty years coaching juniors, still hates sloppy play.", personalityId: "stern-coach" },
  { id: "en-2200-2", name: "Kestrel", avatar: "🧊", elo: 2200, tagline: "Never raises her voice, never loses the endgame.", personalityId: "ice-positional" },
  { id: "en-2200-3", name: "Master Okonkwo", avatar: "📜", elo: 2200, tagline: "Writes verse about pawn structures between tournaments.", personalityId: "poet-philosopher" },

  { id: "en-2300-1", name: "Yuki Amano", avatar: "🌨️", elo: 2300, tagline: "Plays like the temperature dropped ten degrees.", personalityId: "ice-positional" },
  { id: "en-2300-2", name: "Coach Reindert", avatar: "🗒️", elo: 2300, tagline: "Demands you explain every move before you make it.", personalityId: "stern-coach" },
  { id: "en-2300-3", name: "Halima the Quiet", avatar: "🪶", elo: 2300, tagline: "Finds a small truth in every blunder, hers or yours.", personalityId: "poet-philosopher" },

  { id: "en-2400-1", name: "Professor Marchetti", avatar: "🖋️", elo: 2400, tagline: "Compares every opening to a chapter of an old novel.", personalityId: "poet-philosopher" },
  { id: "en-2400-2", name: "Sten Kallio", avatar: "🥶", elo: 2400, tagline: "Squeezes tiny edges until they become whole games.", personalityId: "ice-positional" },
  { id: "en-2400-3", name: "Coach Duyen", avatar: "📈", elo: 2400, tagline: "Trained three national juniors, forgives nothing sloppy.", personalityId: "stern-coach" },

  { id: "en-2500-1", name: "Coach Ferreira", avatar: "🏅", elo: 2500, tagline: "Former national trainer, still counts every tempo.", personalityId: "stern-coach" },
  { id: "en-2500-2", name: "Old Wen Zhi", avatar: "🌙", elo: 2500, tagline: "Has played chess so long the board feels like memory.", personalityId: "poet-philosopher" },
  { id: "en-2500-3", name: "Astrid Colder", avatar: "❄️", elo: 2500, tagline: "Trades down to a winning ending before you notice.", personalityId: "ice-positional" },

  { id: "en-2600-1", name: "Ravensworth", avatar: "🧊", elo: 2600, tagline: "A grandmaster's patience wrapped in total silence.", personalityId: "ice-positional" },
  { id: "en-2600-2", name: "The Wandering Sage", avatar: "🌌", elo: 2600, tagline: "Talks about the board like it's telling him a secret.", personalityId: "poet-philosopher" },
  { id: "en-2600-3", name: "Coach Imre", avatar: "🧭", elo: 2600, tagline: "Trains title players now, still hates a hanging piece.", personalityId: "stern-coach" },

  // --- Master band (2700-3200) ---
  { id: "en-2700-1", name: "The Quiet One", avatar: "🖤", elo: 2700, tagline: "Says nothing, wins anyway, unnerves everyone at the club.", personalityId: "quiet-assassin" },
  { id: "en-2700-2", name: "Nightshade", avatar: "🕷️", elo: 2700, tagline: "You won't see the plan until it's already finished.", personalityId: "quiet-assassin" },
  { id: "en-2700-3", name: "UNIT-07", avatar: "🤖", elo: 2700, tagline: "Calculates twelve moves deep before your coffee cools.", personalityId: "engine-terse" },

  { id: "en-2800-1", name: "Mister Grey", avatar: "🌫️", elo: 2800, tagline: "Calm as still water, twice as dangerous underneath.", personalityId: "quiet-assassin" },
  { id: "en-2800-2", name: "CORE-X", avatar: "💻", elo: 2800, tagline: "No hobbies, no ego, just very deep search trees.", personalityId: "engine-terse" },
  { id: "en-2800-3", name: "PROTOCOL-9", avatar: "📡", elo: 2800, tagline: "Runs on cold logic and an uncomfortable amount of depth.", personalityId: "engine-terse" },

  { id: "en-2900-1", name: "The Silent Blade", avatar: "🗡️", elo: 2900, tagline: "Finishes games quietly, like nothing happened at all.", personalityId: "quiet-assassin" },
  { id: "en-2900-2", name: "Vesper Kane", avatar: "🌘", elo: 2900, tagline: "Waits three moves longer than feels comfortable, then strikes.", personalityId: "quiet-assassin" },
  { id: "en-2900-3", name: "ARBITER-3", avatar: "⚙️", elo: 2900, tagline: "Evaluates everything, apologizes for nothing.", personalityId: "engine-terse" },

  { id: "en-3000-1", name: "The Hollow King", avatar: "👑", elo: 3000, tagline: "Barely speaks, barely blinks, rarely loses.", personalityId: "quiet-assassin" },
  { id: "en-3000-2", name: "NEXUS-11", avatar: "🛰️", elo: 3000, tagline: "Trained on a million games, bored by most of them.", personalityId: "engine-terse" },
  { id: "en-3000-3", name: "VECTOR-Prime", avatar: "🔷", elo: 3000, tagline: "Speaks only in evaluations, means every decimal.", personalityId: "engine-terse" },

  { id: "en-3100-1", name: "Obsidian", avatar: "⬛", elo: 3100, tagline: "A former champion who stopped needing an audience.", personalityId: "quiet-assassin" },
  { id: "en-3100-2", name: "The Undertaker", avatar: "⚰️", elo: 3100, tagline: "Buries games quietly, three moves before you notice.", personalityId: "quiet-assassin" },
  { id: "en-3100-3", name: "DEEPWELL", avatar: "🌊", elo: 3100, tagline: "Search depth measured in days, patience measured in none.", personalityId: "engine-terse" },

  { id: "en-3200-1", name: "The Last Word", avatar: "🎴", elo: 3200, tagline: "Says one line all game, and it's usually \"checkmate.\"", personalityId: "quiet-assassin" },
  { id: "en-3200-2", name: "OMEGA-Systems", avatar: "🖥️", elo: 3200, tagline: "The strongest thing in the building, and it knows it.", personalityId: "engine-terse" },
  { id: "en-3200-3", name: "SINGULARITY", avatar: "🌀", elo: 3200, tagline: "Depth unlimited. Mercy: not found in the parameters.", personalityId: "engine-terse" },
];
